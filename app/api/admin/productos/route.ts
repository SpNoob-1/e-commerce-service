import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 🟢 1. GET: Listar productos para el panel del Admin con paginación avanzada
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Traemos tanto activos como ocultos para que el Admin mantenga control total
    const [productos, totalProductos] = await prisma.$transaction([
      prisma.producto.findMany({
        include: {
          tipoProducto: true, // Relación para leer el nombre real de la categoría
        },
        orderBy: { fechaCreacion: "desc" },
        skip: skip,
        take: limit,
      }),
      prisma.producto.count(),
    ]);

    const totalPaginas = Math.ceil(totalProductos / limit);

    return NextResponse.json({
      productos,
      meta: {
        totalProductos,
        paginaActual: page,
        totalPaginas,
        limite: limit,
      },
    });
  } catch (error) {
    console.error("❌ Error en GET /api/admin/productos:", error);
    return NextResponse.json(
      { error: "Error interno al cargar el inventario del admin." },
      { status: 500 },
    );
  }
}

// 🔵 2. POST: Registrar un nuevo Producto o Servicio mapeando categorías reales
export async function POST(request) {
  try {
    const body = await request.json();
    const { nombre, descripcion, precio, cantidad, imagenUrl, tipoProductoId } =
      body;

    if (!nombre || precio === undefined || !tipoProductoId) {
      return NextResponse.json(
        { error: "El nombre, precio y categoría son obligatorios." },
        { status: 400 },
      );
    }

    // Buscamos dinámicamente la categoría seleccionada para no adivinar IDs
    const categoria = await prisma.tipoProducto.findUnique({
      where: { id: Number(tipoProductoId) },
    });

    if (!categoria) {
      return NextResponse.json(
        { error: "La categoría seleccionada no existe en el sistema." },
        { status: 400 },
      );
    }

    // Si el nombre de la categoría mapea un servicio, el stock es estrictamente 0
    const esServicio = ["Servicios Técnicos", "Consultorías"].includes(
      categoria.nombre,
    );
    const cantidadFinal = esServicio ? 0 : parseInt(cantidad || "0");

    const nuevoProducto = await prisma.producto.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion || "",
        precio: parseFloat(precio),
        cantidad: cantidadFinal,
        imagenUrl:
          imagenUrl ||
          "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500",
        tipoProductoId: Number(tipoProductoId),
        activo: true,
      },
    });

    return NextResponse.json(nuevoProducto, { status: 201 });
  } catch (error) {
    console.error("❌ Error en POST /api/admin/productos:", error);
    return NextResponse.json(
      { error: "Error al guardar el producto o servicio." },
      { status: 500 },
    );
  }
}

// 🟡 3. PUT: Actualizar cualquier campo (Stock rápido, Soft-Delete, o Modal Completo)
export async function PUT(request) {
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
        { error: "El ID del producto es requerido." },
        { status: 400 },
      );
    }

    // Preparar objeto de actualización limpia usando undefined si el campo no viene en la petición
    const dataUpdate = {
      nombre: nombre !== undefined ? nombre.trim() : undefined,
      descripcion: descripcion !== undefined ? descripcion : undefined,
      precio: precio !== undefined ? parseFloat(precio) : undefined,
      activo: activo !== undefined ? activo : undefined,
      imagenUrl: imagenUrl !== undefined ? imagenUrl : undefined,
    };

    // Si nos mandan a actualizar la categoría o el stock, validamos inteligentemente
    if (tipoProductoId !== undefined) {
      dataUpdate.tipoProductoId = Number(tipoProductoId);
    }

    if (cantidad !== undefined) {
      // Validamos si el producto es un servicio para impedir meterle stock por accidente
      const productoActual = await prisma.producto.findUnique({
        where: { id: Number(id) },
        include: { tipoProducto: true },
      });

      const esServicio = productoActual?.tipoProducto?.nombre
        ? ["Servicios Técnicos", "Consultorías"].includes(
            productoActual.tipoProducto.nombre,
          )
        : false;

      dataUpdate.cantidad = esServicio ? 0 : parseInt(cantidad);
    }

    const productoActualizado = await prisma.producto.update({
      where: { id: Number(id) },
      data: dataUpdate,
      include: { tipoProducto: true },
    });

    return NextResponse.json(productoActualizado, { status: 200 });
  } catch (error) {
    console.error("❌ Error en PUT /api/admin/productos:", error);
    return NextResponse.json(
      { error: "Error al actualizar el producto o servicio." },
      { status: 500 },
    );
  }
}
