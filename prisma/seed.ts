import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("⏳ Iniciando el sembrado seguro...");

  // 1. Limpiamos SOLO lo relacionado con productos para no romper los usuarios existentes
  await prisma.producto.deleteMany({});
  await prisma.tipoProducto.deleteMany({});

  // 2. En lugar de borrar y recrear Roles, los buscamos o creamos de forma segura (Upsert)
  // Si ya existen, los deja en paz; si no, los crea.
  const rolAdmin = await prisma.rol.upsert({
    where: { nombre: "Administrador" },
    update: {},
    create: { nombre: "Administrador" },
  });

  const rolCliente = await prisma.rol.upsert({
    where: { nombre: "Cliente" },
    update: {},
    create: { nombre: "Cliente" },
  });

  // 3. Lo mismo para los Estados de la Orden
  const estPendiente = await prisma.estadoOrden.upsert({
    where: { nombre: "Pendiente" },
    update: {},
    create: { nombre: "Pendiente" },
  });

  const estCompletado = await prisma.estadoOrden.upsert({
    where: { nombre: "Completado" },
    update: {},
    create: { nombre: "Completado" },
  });

  // 4. Crear los Tipos de Producto
  const tipoFisico = await prisma.tipoProducto.create({
    data: { nombre: "Físico" },
  });
  const tipoServicio = await prisma.tipoProducto.create({
    data: { nombre: "Servicio" },
  });

  // 5. Crear los productos de prueba
  await prisma.producto.createMany({
    data: [
      {
        nombre: "Laptop Dell Latitude Custom",
        descripcion:
          "Procesador de alta gama, ideal para desarrollo con Linux Mint y entornos Distrobox.",
        precio: 450.0,
        cantidad: 10,
        tipoProductoId: tipoFisico.id,
        imagenUrl:
          "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500",
      },
      {
        nombre: "Mantenimiento Correctivo de Hardware",
        descripcion:
          "Limpieza profunda, cambio de pasta térmica y optimización de componentes internos.",
        precio: 45.0,
        cantidad: 0,
        tipoProductoId: tipoServicio.id,
        imagenUrl:
          "https://images.unsplash.com/photo-1563770660941-20978e870e26?w=500",
      },
      {
        nombre: "Teclado Mecánico Custom Dark",
        descripcion:
          "Switches táctiles silenciosos y estética pixel-art ideal para setup en modo oscuro.",
        precio: 85.5,
        cantidad: 15,
        tipoProductoId: tipoFisico.id,
        imagenUrl:
          "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500",
      },
      {
        nombre: "Asesoría y Configuración de Servidores Locales",
        descripcion:
          "Configuración experta de entornos locales, Docker, bases de datos seguras y optimización de rendimiento.",
        precio: 60.0,
        cantidad: 0,
        tipoProductoId: tipoServicio.id,
        imagenUrl:
          "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=500",
      },
    ],
  });

  console.log(
    "🌱 ¡Base de datos sembrada con éxito y sin perder tus usuarios!",
  );
}

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
