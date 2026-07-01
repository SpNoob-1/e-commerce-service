import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Listar todas las categorías para los selectores o tablas
export async function GET() {
  try {
    const categorias = await prisma.tipoProducto.findMany({
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(categorias);
  } catch (error) {
    console.error("❌ Error al obtener categorías:", error);
    return NextResponse.json(
      { error: "Error al obtener las categorías" },
      { status: 500 },
    );
  }
}

// POST: Crear una nueva categoría desde el Admin
export async function POST(request: Request) {
  try {
    const { nombre } = await request.json();

    if (!nombre || nombre.trim() === "") {
      return NextResponse.json(
        { error: "El nombre de la categoría es obligatorio." },
        { status: 400 },
      );
    }

    const nuevaCategoria = await prisma.tipoProducto.create({
      data: {
        nombre: nombre.trim(),
      },
    });

    return NextResponse.json(nuevaCategoria, { status: 201 });
  } catch (error) {
    console.error("❌ Error al crear categoría:", error);
    // Controlar si intentan duplicar un nombre único
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese nombre." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Error interno al crear la categoría" },
      { status: 500 },
    );
  }
}
