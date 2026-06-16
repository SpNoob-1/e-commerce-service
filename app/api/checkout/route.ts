import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import { generarHtmlEmail } from "@/lib/emailTemplate";

const prisma = new PrismaClient();

// ⚙️ 3. Configuración del Transporte de Correo
// Para desarrollo te recomiendo usar una cuenta de Gmail o un servicio de pruebas como Mailtrap
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // false porque estamos usando el puerto 2525 en desarrollo
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(request: Request) {
  try {
    const { usuarioId, items } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "El carrito está vacío" },
        { status: 400 },
      );
    }

    // ⚡ Iniciamos la transacción en Prisma
    const resultadoOrden = await prisma.$transaction(async (tx) => {
      let totalOrden = 0;
      const detallesParaGuardar = [];

      for (const item of items) {
        const productoBD = await tx.producto.findUnique({
          where: { id: Number(item.id) },
        });

        if (!productoBD || !productoBD.activo) {
          throw new Error(
            `El producto o servicio "${item.nombre}" ya no está disponible.`,
          );
        }

        const precioUnitario = Number(productoBD.precio);

        if (item.tipo === "Físico") {
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

          detallesParaGuardar.push({
            productoId: productoBD.id,
            cantidad: cantidadPedida,
            precioUnit: precioUnitario,
            fechaInicio: null,
            fechaFin: null,
          });
        } else if (item.tipo === "Servicio") {
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
          });
        }
      }

      // Guardamos la orden principal con sus detalles en cascada
      return await tx.orden.create({
        data: {
          usuarioId: Number(usuarioId),
          total: totalOrden,
          estadoOrdenId: 1,
          detalles: {
            create: detallesParaGuardar,
          },
        },
      });
    });

    // 📬 4. DISPARAR EL CORREO ELECTRÓNICO (Fuera de la transacción para no ralentizar la base de datos)
    try {
      // Buscamos el correo del usuario implicado (puedes adaptarlo según tu tabla Usuario)
      const usuario = await prisma.usuario.findUnique({
        where: { id: Number(usuarioId) },
      });

      const correoDestino = usuario?.email || "tu-correo-de-pruebas@gmail.com";

      const htmlContenido = generarHtmlEmail({
        ordenId: resultadoOrden.id,
        total: Number(resultadoOrden.total),
        items: items,
      });

      await transporter.sendMail({
        from: `"Catálogo de Soluciones" <${process.env.EMAIL_USER}>`,
        to: correoDestino,
        subject: `Confirmación de Orden #${resultadoOrden.id} 🚀`,
        html: htmlContenido,
      });

      console.log(
        `📧 Correo enviado con éxito para la orden #${resultadoOrden.id}`,
      );
    } catch (emailError) {
      // Si el correo falla, logueamos el error pero NO tumbamos la compra del usuario
      console.error("❌ Error al enviar el correo:", emailError);
    }

    // Retornamos la respuesta exitosa al frontend
    return NextResponse.json({
      message: "Orden procesada correctamente y correo enviado",
      ordenId: resultadoOrden.id,
      total: resultadoOrden.total,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
