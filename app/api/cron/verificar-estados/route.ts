import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  // 🔐 Validación de seguridad opcional:
  // Para evitar que cualquiera ejecute este cron, puedes verificar un Token secreto en las cabeceras
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    console.log("🕒 [CRON] Iniciando verificación automatizada de estados...");
    const ahora = new Date();

    // ==========================================
    // 1. FLUJO DE SERVICIOS (Rentas Expiradas)
    // ==========================================

    // Buscamos los detalles de órdenes que son servicios, están activos y ya vencieron
    const serviciosVencidos = await prisma.ordenDetalle.findMany({
      where: {
        fechaFin: { lte: ahora },
        estadoDetalle: { nombre: "Activo" },
        producto: {
          tipoProducto: { nombre: { contains: "servicio" } }, // Asegura que sea un servicio
        },
      },
      include: {
        producto: true,
      },
    });

    console.log(
      `⚡ [CRON] Servicios expirados encontrados: ${serviciosVencidos.length}`,
    );

    if (serviciosVencidos.length > 0) {
      // Conseguimos el ID del estado "Completado"
      let estadoCompletado = await prisma.estadoDetalle.findFirst({
        where: { nombre: "Completado" },
      });

      if (!estadoCompletado) {
        estadoCompletado = await prisma.estadoDetalle.create({
          data: { nombre: "Completado" },
        });
      }

      // Ejecutamos en lote las actualizaciones
      await prisma.$transaction([
        // A. Pasamos los detalles de la orden a "Completado"
        prisma.ordenDetalle.updateMany({
          where: { id: { in: serviciosVencidos.map((s) => s.id) } },
          data: { estadoDetalleId: estadoCompletado.id },
        }),

        // B. Devolvemos los servicios a estar activos/disponibles en la página (incrementando su stock o activando un booleano de disponibilidad)
        ...serviciosVencidos.map((srv) =>
          prisma.producto.update({
            where: { id: srv.productoId },
            data: {
              cantidad: {
                increment: srv.cantidad, // El servicio se libera y vuelve al stock de la página
              },
            },
          }),
        ),
      ]);
      console.log(
        "✅ [CRON] Servicios actualizados a 'Completado' y liberados en catálogo.",
      );
    }

    // ==========================================
    // 2. FLUJO DE PRODUCTOS FÍSICOS (Simulador de Entrega)
    // ==========================================

    // Nota: En producción las entregas las marca el admin o tu API de envíos.
    // Pero si quieres que tras pasar la 'fechaFin' estimada pase solo de Pendiente a Entregado:
    const productosParaEntregar = await prisma.ordenDetalle.findMany({
      where: {
        fechaFin: { lte: ahora },
        estadoDetalle: { nombre: "Pendiente" },
        producto: {
          tipoProducto: { nombre: { not: { contains: "servicio" } } }, // Que no sea servicio
        },
      },
    });

    console.log(
      `📦 [CRON] Productos listos para marcar como entregados: ${productosParaEntregar.length}`,
    );

    if (productosParaEntregar.length > 0) {
      let estadoEntregado = await prisma.estadoDetalle.findFirst({
        where: { nombre: "Entregado" },
      });

      if (!estadoEntregado) {
        estadoEntregado = await prisma.estadoDetalle.create({
          data: { nombre: "Entregado" },
        });
      }

      await prisma.ordenDetalle.updateMany({
        where: { id: { in: productosParaEntregar.map((p) => p.id) } },
        data: { estadoDetalleId: estadoEntregado.id },
      });
      console.log("✅ [CRON] Productos físicos actualizados a 'Entregado'.");
    }

    return NextResponse.json({
      success: true,
      serviciosProcesados: serviciosVencidos.length,
      productosEntregados: productosParaEntregar.length,
    });
  } catch (error: any) {
    console.error("💥 [CRON ERROR]:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
