import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 🟢 1. MÉTODO GET (Catálogo paginado con metadatos + Disponibilidad de Rentas)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // 🔍 Detectamos si el frontend solicitó explícitamente paginar
    const quierePaginacion =
      searchParams.has("page") || searchParams.has("limit");

    // 🚀 Extraemos los parámetros de paginación con valores por defecto seguros
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 12; // Tu valor por defecto es 4

    const paginaActual = Math.max(1, page);
    const limite = Math.max(1, limit);
    const saltar = (paginaActual - 1) * limite;

    // 🔥 Transacción paralela en Prisma
    const [totalProductos, productos] = await prisma.$transaction([
      prisma.producto.count({
        where: { activo: true },
      }),
      prisma.producto.findMany({
        where: {
          activo: true,
        },
        // 🌟 SI NO quiere paginación (es el admin viejo), mandamos undefined para traer TODOS
        take: quierePaginacion ? limite : undefined,
        skip: quierePaginacion ? saltar : undefined,
        include: {
          tipoProducto: true,
          detalles: {
            where: {
              fechaFin: { gte: new Date() },
            },
            select: {
              fechaFin: true,
            },
            orderBy: {
              fechaFin: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          fechaCreacion: "desc",
        },
      }),
    ]);

    const totalPaginas = Math.ceil(totalProductos / limite);

    // Inyectamos de forma dinámica el campo 'ocupadoHasta'
    const productosConDisponibilidad = productos.map((p: any) => {
      const ultimaRenta = p.detalles?.[0] || null;

      return {
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: p.precio,
        cantidad: p.cantidad,
        imagenUrl: p.imagenUrl,
        activo: p.activo,
        tipoProductoId: p.tipoProductoId,
        tipoProducto: p.tipoProducto,
        fechaCreacion: p.fechaCreacion,
        ocupadoHasta: ultimaRenta ? ultimaRenta.fechaFin : null,
      };
    });

    // 🌟 AQUÍ ESTÁ EL TRUCO DE COMPATIBILIDAD:
    if (quierePaginacion) {
      // Devuelve la estructura nueva para el catálogo del cliente
      return NextResponse.json(
        {
          productos: productosConDisponibilidad,
          meta: {
            totalProductos,
            paginaActual,
            totalPaginas,
            limite,
          },
        },
        { status: 200 },
      );
    }

    // Devuelve el arreglo plano directo [] para que tu Admin actual NO se rompa y muestre todo
    return NextResponse.json(productosConDisponibilidad, { status: 200 });
  } catch (error) {
    console.error("Error al obtener productos paginados:", error);
    return NextResponse.json(
      { error: "Error interno al cargar el catálogo" },
      { status: 500 },
    );
  }
}

// 🔵 2. MÉTODO POST (Crear nuevos productos)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, descripcion, precio, cantidad, imagenUrl, tipoProductoId } =
      body;

    if (!nombre || precio === undefined || precio === null || !tipoProductoId) {
      return NextResponse.json(
        { error: "El nombre, el precio y el tipo son obligatorios." },
        { status: 400 },
      );
    }

    const nuevoProducto = await prisma.producto.create({
      data: {
        nombre,
        descripcion: descripcion || "",
        precio: parseFloat(body.precio),
        cantidad: parseInt(cantidad || "0"),
        imagenUrl:
          imagenUrl ||
          "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500",
        tipoProductoId: parseInt(tipoProductoId),
        activo: true,
      },
    });

    return NextResponse.json(nuevoProducto, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error en POST /api/productos:", error);
    return NextResponse.json(
      {
        error: "Error interno al guardar el producto",
        detalles: error.message,
      },
      { status: 500 },
    );
  }
}

// 🟡 3. MÉTODO PUT (Actualizar productos e inventario)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      nombre,
      descripcion,
      precio,
      cantidad,
      activo,
      tipoProductoId,
      imagenUrl,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "El ID del producto es obligatorio para actualizar." },
        { status: 400 },
      );
    }

    const productoActualizado = await prisma.producto.update({
      where: { id: parseInt(id) },
      data: {
        nombre: nombre !== undefined ? nombre : undefined,
        descripcion: descripcion !== undefined ? descripcion : undefined,
        precio: precio !== undefined ? parseFloat(precio) : undefined,
        cantidad: cantidad !== undefined ? parseInt(cantidad) : undefined,
        activo: activo !== undefined ? activo : undefined,
        tipoProductoId:
          tipoProductoId !== undefined ? parseInt(tipoProductoId) : undefined,
        imagenUrl: imagenUrl !== undefined ? imagenUrl : undefined,
      },
    });

    return NextResponse.json(productoActualizado, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error en PUT /api/productos:", error);
    return NextResponse.json(
      { error: "Error al actualizar el producto", detalles: error.message },
      { status: 500 },
    );
  }
}
