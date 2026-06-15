import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Traemos los productos activos e incluimos la información de su tipo
    const productos = await prisma.producto.findMany({
      where: {
        activo: true, // Solo muestra los que no esté "borrado"
      },
      include: {
        tipoProducto: true, // Incluye si es "Físico" o "Servicio"
      },
      orderBy: {
        fechaCreacion: "desc", // Los más nuevos primero
      },
    });

    return NextResponse.json(productos, { status: 200 });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return NextResponse.json(
      { error: "Error interno al cargar el catálogo" },
      { status: 500 },
    );
  }
}
