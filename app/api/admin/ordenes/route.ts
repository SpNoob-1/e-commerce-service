import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 🟢 GET: Listar todas las ventas mapeando la orden y TODOS sus detalles individuales
export async function GET() {
  try {
    const ordenes = await prisma.orden.findMany({
      orderBy: { id: "desc" },
      include: {
        usuario: {
          select: {
            nombre: true,
          },
        },
        estadoOrden: true,
        detalles: {
          include: {
            estadoDetalle: true, // Traemos el estado individual del ítem
            producto: {
              include: {
                tipoProducto: true,
              },
            },
          },
        },
      },
    });

    // Mapeamos al contrato exacto que espera tu frontend granular
    const ordenesFormateadas = ordenes.map((o) => {
      return {
        id: o.id,
        id_usuario: o.usuarioId,
        usuario_nombre: o.usuario?.nombre || "Usuario Desconocido",
        total: Number(o.total),
        fecha: o.fecha
          ? new Date(o.fecha).toISOString().split("T")[0]
          : "Sin fecha",
        estado: o.estadoOrden?.nombre || "Pendiente",
        // Mapeamos los detalles uno a uno para el panel derecho
        detalles: o.detalles.map((d) => {
          const nombreCategoria = d.producto?.tipoProducto?.nombre || "";
          // Sincronizamos con las categorías del sistema para determinar de forma segura si es servicio
          const esServicio = ["Servicios Técnicos", "Consultorías"].includes(
            nombreCategoria,
          );

          return {
            id: d.id,
            cantidad: d.cantidad,
            precioUnit: Number(d.precioUnit),
            fechaInicio: d.fechaInicio
              ? new Date(d.fechaInicio).toISOString().split("T")[0]
              : null,
            fechaFin: d.fechaFin
              ? new Date(d.fechaFin).toISOString().split("T")[0]
              : null,
            estadoDetalle: d.estadoDetalle?.nombre || "Pendiente", // Estado individual
            producto: {
              nombre: d.producto?.nombre || "Producto eliminado",
              esServicio: esServicio, // Flag booleano limpio para el frontend
            },
          };
        }),
      };
    });

    return NextResponse.json(ordenesFormateadas);
  } catch (error: any) {
    console.error("💥 Error en GET API Admin Órdenes:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🟡 PUT: Modificar el estado global o granular (detalles) y controlar stock de forma transaccional
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    // Soportamos tanto 'estadoOrdenId' (id numérico del select) como 'detalles' individuales
    const { ordenId, estadoOrdenId, detalles } = body;

    if (!ordenId) {
      return NextResponse.json(
        { error: "El parámetro ordenId es obligatorio." },
        { status: 400 },
      );
    }

    console.log(
      `\n========== [PROCESANDO ACTUALIZACIÓN ORDEN #${ordenId}] ==========`,
    );

    // Iniciamos una transacción para asegurar la consistencia del stock y estados
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Verificar el estado previo de la orden para el control de stock
      const ordenPrevia = await tx.orden.findUnique({
        where: { id: Number(ordenId) },
        include: { estadoOrden: true },
      });

      if (!ordenPrevia) {
        throw new Error("La orden solicitada no existe.");
      }

      // 2. Manejo de Cambio de Estado Global
      if (estadoOrdenId !== undefined) {
        // Buscamos el nombre del nuevo estado para ver si es 'cancelado'
        const nuevoEstado = await tx.estadoOrden.findUnique({
          where: { id: Number(estadoOrdenId) },
        });

        const yaEstabaCancelada =
          ordenPrevia.estadoOrden?.nombre.toLowerCase() === "cancelado";
        const esCancelacionNueva =
          nuevoEstado?.nombre.toLowerCase() === "cancelado" &&
          !yaEstabaCancelada;

        // Si pasa a cancelada, devolvemos el stock de sus productos al inventario
        if (esCancelacionNueva) {
          const detallesOrden = await tx.ordenDetalle.findMany({
            where: { ordenId: Number(ordenId) },
          });

          for (const detalle of detallesOrden) {
            await tx.producto.update({
              where: { id: detalle.productoId },
              data: {
                cantidad: { increment: detalle.cantidad },
              },
            });
          }
          console.log(
            `📦 Stock de la orden #${ordenId} devuelto al inventario debido a cancelación.`,
          );
        }

        // Actualizamos el estado global en la base de datos
        await tx.orden.update({
          where: { id: Number(ordenId) },
          data: { estadoOrdenId: Number(estadoOrdenId) },
        });
      }

      // 3. Manejo de Estados Granulares en Ítems Individuales (Detalles)
      if (detalles && Array.isArray(detalles)) {
        for (const item of detalles) {
          await tx.ordenDetalle.update({
            where: { id: Number(item.id) },
            data: { estadoDetalleId: Number(item.estadoDetalleId) },
          });
        }
        console.log(
          `⚙️ Se actualizaron los estados de ${detalles.length} sub-ítems individuales.`,
        );
      }

      // Devolvemos la orden completamente actualizada y estructurada para refrescar el Front
      return await tx.orden.findUnique({
        where: { id: Number(ordenId) },
        include: {
          estadoOrden: true,
          detalles: {
            include: {
              estadoDetalle: true,
              producto: true,
            },
          },
        },
      });
    });

    return NextResponse.json(
      {
        message: "Logística y stock sincronizados con éxito.",
        ordenActualizada: resultado,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("💥 Error en PUT API Admin Órdenes:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
