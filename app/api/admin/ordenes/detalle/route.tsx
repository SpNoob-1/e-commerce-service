import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request) {
  try {
    const { detalleId, nuevoEstadoNombre } = await request.json();

    if (!detalleId || !nuevoEstadoNombre) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 },
      );
    }

    // 1. Buscamos o creamos el estado en la tabla de estados de detalle
    let estado = await prisma.estadoDetalle.findFirst({
      where: { nombre: nuevoEstadoNombre },
    });

    if (!estado) {
      estado = await prisma.estadoDetalle.create({
        data: { nombre: nuevoEstadoNombre },
      });
    }

    // 2. Actualizamos el ítem específico de la orden
    const detalleActualizado = await prisma.ordenDetalle.update({
      where: { id: Number(detalleId) },
      data: { estadoDetalleId: estado.id },
      include: { producto: true },
    });

    // 🌟 Lógica de Negocio: Si un servicio se cancela o completa manualmente, liberamos su stock
    if (
      detalleActualizado.producto.tipo === "Servicio" &&
      (nuevoEstadoNombre === "Completado" || nuevoEstadoNombre === "Cancelado")
    ) {
      await prisma.producto.update({
        where: { id: detalleActualizado.productoId },
        data: { cantidad: { increment: detalleActualizado.cantidad } },
      });
    }

    return NextResponse.json({ success: true, detalleActualizado });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
