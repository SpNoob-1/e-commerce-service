import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// 🚀 Definimos el tipo exacto que va a retornar la consulta con los includes
type OrdenConRelaciones = Prisma.OrdenGetPayload<{
  include: {
    estadoOrden: true;
    detalles: {
      include: {
        estadoDetalle: true;
        producto: {
          include: {
            tipoProducto: true;
          };
        };
      };
    };
  };
}>;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get("usuarioId");

    console.log(`\n========== [HISTORIAL INICIO] ==========`);
    console.log(`🔍 Buscando órdenes para usuarioId:`, usuarioId);

    if (!usuarioId || usuarioId === "undefined" || usuarioId === "null") {
      console.log(`⚠️  Error: El ID recibido no es válido.`);
      return NextResponse.json(
        { error: "Falta el ID de usuario o es inválido" },
        { status: 400 },
      );
    }

    // Consulta limpia tipada
    const ordenes = (await prisma.orden.findMany({
      where: { usuarioId: Number(usuarioId) },
      orderBy: { id: "desc" },
      include: {
        estadoOrden: true,
        detalles: {
          include: {
            estadoDetalle: true,
            producto: {
              include: {
                tipoProducto: true,
              },
            },
          },
        },
      },
    })) as OrdenConRelaciones[];

    console.log(`📊 Órdenes encontradas en MySQL: ${ordenes.length}`);

    // Normalizamos enviando una estructura plana y predecible al frontend del cliente
    const ordenesNormalizadas = ordenes.map((orden) => {
      return {
        id: orden.id,
        usuarioId: orden.usuarioId,
        total: Number(orden.total),
        fecha: orden.fecha
          ? new Date(orden.fecha).toISOString().split("T")[0]
          : "Sin fecha",
        estado: orden.estadoOrden?.nombre || "Pendiente", // 👈 Lee directo el estado dinámico que cambia el Admin
        detalles: (orden.detalles || []).map((detalle) => {
          const productoData = detalle.producto;

          if (!productoData) {
            return {
              id: detalle.id,
              cantidad: detalle.cantidad,
              precioUnit: Number(detalle.precioUnit),
              estadoLogistico: "Desconocido",
              producto: { nombre: "Producto no disponible", tipo: "Físico" },
            };
          }

          // Determinamos el tipo real del producto ("Servicio" o "Físico")
          const nombreTipo =
            productoData.tipoProducto?.nombre?.toLowerCase() || "físico";
          const tipoFormateado = nombreTipo.includes("servicio")
            ? "Servicio"
            : "Físico";

          return {
            id: detalle.id,
            ordenId: detalle.ordenId,
            productoId: detalle.productoId,
            cantidad: detalle.cantidad,
            precioUnit: Number(detalle.precioUnit),
            fechaInicio: detalle.fechaInicio,
            fechaFin: detalle.fechaFin,
            estadoLogistico: detalle.estadoDetalle?.nombre || "Pendiente", // Flujo individual por ítem si se requiere
            producto: {
              nombre: productoData.nombre || "Producto sin nombre",
              tipo: tipoFormateado,
            },
          };
        }),
      };
    });

    console.log(`========== [HISTORIAL FIN] ==========\n`);

    // Retorna la data estructurada idéntica a lo que espera tu cliente reactivo
    return NextResponse.json({ ordenes: ordenesNormalizadas });
  } catch (error: any) {
    console.error("💥 Error fatal en API de órdenes:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
