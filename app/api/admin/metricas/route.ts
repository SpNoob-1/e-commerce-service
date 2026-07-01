import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Ingresos Totales acumulados por órdenes pagadas (reemplaza 'id_estado_pagado' por tu ID real si aplica)
    const agregacionIngresos = await prisma.orden.aggregate({
      _sum: {
        total: true,
      },
    });
    const ingresosTotales = Number(agregacionIngresos._sum.total || 0);

    // 2. Volumen de órdenes totales registradas
    const ventasExitosas = await prisma.orden.count();

    // 3. Alertas de Inventario: Items físicos cuyo stock es menor o igual a 1 unidad
    // Excluimos servicios basándonos en que tu tipo de servicio tiene ID 6 (o el ID de tu tabla)
    const productosCriticos = await prisma.producto.count({
      where: {
        activo: true,
        tipoProductoId: { not: 6 }, // Filtrar para no evaluar servicios continuos
        cantidad: { lte: 1 },
      },
    });

    return NextResponse.json({
      ingresosTotales,
      ventasExitosas,
      productosCriticos,
    });
  } catch (error: any) {
    console.error("💥 Error en API Admin Métricas:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
