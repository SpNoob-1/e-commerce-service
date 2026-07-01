import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { enviarCorreoConfirmacionOrden } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const {
      usuarioId,
      envioNombre,
      envioCorreo,
      envioTelefono,
      envioDireccion,
      items,
      tarjeta,
    } = await request.json();

    console.log(`\n========== [CHECKOUT INICIO] ==========`);
    console.log(`📦 Cantidad de items en carrito:`, items?.length || 0);

    // 🚨 VALIDACIÓN DE CONTACTO OBLIGATORIA
    if (!envioNombre || !envioCorreo || !envioTelefono) {
      return NextResponse.json(
        {
          error:
            "El nombre, correo y teléfono son obligatorios para procesar el pedido.",
        },
        { status: 400 },
      );
    }

    // 🚨 VALIDACIÓN DE SEGURIDAD SIMULADA Y PAGO
    if (!tarjeta || !tarjeta.numero || tarjeta.cvv.length !== 3) {
      return NextResponse.json(
        {
          error:
            "La transacción bancaria fue rechazada. Verifica tus datos de pago.",
        },
        { status: 400 },
      );
    }

    const numeroTarjetaLimpio = tarjeta.numero.replace(/\s/g, "");
    if (numeroTarjetaLimpio.endsWith("0000")) {
      return NextResponse.json(
        {
          error:
            "Fondos insuficientes. Intenta con otra tarjeta de débito o crédito.",
        },
        { status: 402 },
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "El carrito está vacío" },
        { status: 400 },
      );
    }

    // 🌟 LIMPIEZA CORRECTA DEL USUARIO ID (Soporte perfecto para Invitados)
    const idUsuarioFinal =
      usuarioId &&
      usuarioId !== "null" &&
      usuarioId !== "undefined" &&
      String(usuarioId).trim() !== ""
        ? Number(usuarioId)
        : null;

    console.log(`👤 idUsuarioFinal procesado en Servidor:`, idUsuarioFinal);

    let logisticaPendiente = await prisma.estadoDetalle.findUnique({
      where: { nombre: "Pendiente" },
    });
    if (!logisticaPendiente)
      logisticaPendiente = await prisma.estadoDetalle.create({
        data: { nombre: "Pendiente" },
      });

    let logisticaActivo = await prisma.estadoDetalle.findUnique({
      where: { nombre: "Activo" },
    });
    if (!logisticaActivo)
      logisticaActivo = await prisma.estadoDetalle.create({
        data: { nombre: "Activo" },
      });

    // ⚡ Iniciamos la transacción en Prisma
    const resultadoOrden = await prisma.$transaction(async (tx) => {
      let totalOrden = 0;
      const detallesParaGuardar = [];

      for (const item of items) {
        const productoBD = await tx.producto.findUnique({
          where: { id: Number(item.id) },
          include: { tipoProducto: true },
        });

        if (!productoBD || !productoBD.activo) {
          throw new Error(
            `El producto o servicio "${item.nombre}" ya no está disponible.`,
          );
        }

        const precioUnitario = Number(productoBD.precio);
        const esServicio = [2, 3].includes(productoBD.tipoProductoId);

        if (!esServicio) {
          // ==========================================================
          // 📦 LÓGICA PARA PRODUCTO FÍSICO (Permite invitados)
          // ==========================================================
          const cantidadPedida = item.cantidadSeleccionada || 1;

          if (productoBD.cantidad < cantidadPedida) {
            throw new Error(
              `Stock insuficiente para "${item.nombre}". Disponible: ${productoBD.cantidad}`,
            );
          }

          await tx.producto.update({
            where: { id: productoBD.id },
            data: { cantidad: productoBD.cantidad - cantidadPedida },
          });

          totalOrden += precioUnitario * cantidadPedida;

          const fechaEntregaFisico = new Date();
          fechaEntregaFisico.setDate(fechaEntregaFisico.getDate() + 3);

          detallesParaGuardar.push({
            productoId: productoBD.id,
            cantidad: cantidadPedida,
            precioUnit: precioUnitario,
            fechaInicio: new Date(),
            fechaFin: fechaEntregaFisico,
            estadoDetalleId: logisticaPendiente!.id,
          });
        } else {
          // ==========================================================
          // ⚡ LÓGICA PARA SERVICIO / CONSULTORÍA (Obliga inicio de sesión)
          // ==========================================================

          // 🚨 RESTRICCIÓN: Si es un servicio y es invitado (idUsuarioFinal es null), rebotamos la transacción
          if (!idUsuarioFinal) {
            throw new Error(
              `Para reservar el servicio "${item.nombre}" debes iniciar sesión o crear una cuenta.`,
            );
          }

          if (!item.fechaInicio || !item.fechaFin) {
            throw new Error(
              `El servicio "${item.nombre}" requiere definir fechas de inicio y fin.`,
            );
          }

          const choqueFechas = await tx.ordenDetalle.findFirst({
            where: {
              productoId: productoBD.id,
              NOT: {
                OR: [
                  { fechaFin: { lt: new Date(item.fechaInicio) } },
                  { fechaInicio: { gt: new Date(item.fechaFin) } },
                ],
              },
            },
          });

          if (choqueFechas) {
            throw new Error(
              `El servicio "${item.nombre}" ya está reservado para las fechas seleccionadas.`,
            );
          }

          totalOrden += precioUnitario;

          detallesParaGuardar.push({
            productoId: productoBD.id,
            cantidad: 1,
            precioUnit: precioUnitario,
            fechaInicio: new Date(item.fechaInicio),
            fechaFin: new Date(item.fechaFin),
            estadoDetalleId: logisticaActivo!.id,
          });
        }
      }

      // Guardamos la orden vinculando el idUsuarioFinal (número o null)
      return await tx.orden.create({
        data: {
          usuarioId: idUsuarioFinal,
          total: totalOrden,
          estadoOrdenId: 1,
          envioNombre,
          envioCorreo,
          envioTelefono,
          envioDireccion: envioDireccion || null,
          detalles: {
            create: detallesParaGuardar,
          },
        },
      });
    });

    console.log(`💾 Orden creada con éxito ID: #${resultadoOrden.id}`);

    // Envió de correo (Resend) fuera de la transacción...
    try {
      let correoDestino = envioCorreo.trim().toLowerCase();
      if (
        correoDestino !== "skylumina090@gmail.com" &&
        correoDestino !== "difim37497@preparmy.com"
      ) {
        correoDestino = "skylumina090@gmail.com";
      }
      await enviarCorreoConfirmacionOrden(
        correoDestino,
        resultadoOrden.id,
        Number(resultadoOrden.total),
        items,
      );
    } catch (emailError) {
      console.error("❌ Error en Resend:", emailError);
    }

    return NextResponse.json({
      message: "Orden procesada correctamente",
      ordenId: resultadoOrden.id,
      total: resultadoOrden.total,
    });
  } catch (error: any) {
    console.error(`💥 Error general en el Checkout:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
