"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { CatalogSkeleton } from "./skeletons";

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  cantidad: number;
  imagenUrl: string | null;
  tipoProducto: {
    nombre: string;
  };
}

// 📦 1. COMPONENTE DE LA LISTA: Lógica de datos y mapeo del diseño de referencia
export default function CatalogList() {
  // 1. Petición limpia con useQuery tradicional
  const {
    data: productos,
    isLoading,
    isError,
  } = useQuery<Producto[]>({
    queryKey: ["productos"],
    queryFn: async () => {
      const response = await fetch("/api/productos");
      if (!response.ok) throw new Error("No se pudo cargar el catálogo");
      return response.json();
    },
  });

  // 2. PANTALLA DE CARGA: Si React Query dice que está cargando, dibujamos la cuadrícula de esqueletos
  if (isLoading) {
    return (
      <div>
        <CatalogSkeleton />
      </div>
    );
  }

  // 3. PANTALLA DE ERROR: Por si se cae MySQL o la API falla
  if (isError) {
    return (
      <div className="text-center py-12 text-red-400 font-medium">
        ⚠️ Error al conectar con el servidor. Inténtalo de nuevo.
      </div>
    );
  }

  return (
    // {/* 🛒 CONTENEDOR PRINCIPAL: Aquí aplicamos la rejilla responsiva que controla todo */}
    <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
      {productos?.map((producto) => (
        <div
          className="group bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl text-zinc-50 flex flex-col justify-between shadow-lg shadow-black/20 hover:border-zinc-700 transition-all duration-300 relative"
          key={producto.id}
        >
          {/* 🎯 ENCABEZADO ESTILO COMENTARIO */}
          <div className="flex items-center gap-3 mb-4">
            {/* Círculo con ID */}
            <div className="w-8 h-8 flex items-center justify-center bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-bold rounded-full shrink-0">
              #{producto.id}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-zinc-100 tracking-tight line-clamp-2 h-12 group-hover:text-white transition-colors">
                {producto.nombre}
              </h2>
              {/* ⚠️ SOLUCIÓN TYPESCRIPT: Agregamos "?" por si tipoProducto viene vacío de la DB */}
              <p className="text-xs text-zinc-400 font-medium tracking-wide uppercase mt-0.5">
                {producto.tipoProducto?.nombre || "Producto"}
              </p>
            </div>
          </div>

          {/* 🖼️ CONTENEDOR DE LA IMAGEN REESTILIZADO */}
          {producto.imagenUrl && (
            // Le damos un contenedor con aspecto fijo (tipo banner o cuadrado) para que no se deforme
            <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4 bg-zinc-950">
              <Image
                className="object-cover group-hover:scale-105 transition-transform duration-500" // Efecto de zoom suave al pasar el mouse
                src={producto.imagenUrl}
                alt={producto.nombre}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={Number(producto.id) <= 2}
              />
            </div>
          )}

          {/* 📄 CUERPO TEXTUAL */}
          <div className="flex-grow mb-6">
            <p className="text-sm text-zinc-400 line-clamp-3 leading-relaxed">
              {producto.descripcion}
            </p>
          </div>

          {/* 💸 ACCIONES Y PRECIO */}
          {/* 💸 ACCIONES, PRECIO Y STOCK (Cumpliendo criterios de la USAC) */}
          <div className="mt-auto pt-4 border-t border-zinc-800/60 flex flex-col gap-3">
            {/* 📦 INDICADOR DE STOCK (Solo se muestra si es un Producto Físico) */}
            {producto.tipoProducto?.nombre === "Físico" && (
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-zinc-500 font-medium">
                  Disponibilidad:
                </span>
                {producto.cantidad > 0 ? (
                  <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full text-[11px]">
                    {producto.cantidad} en stock
                  </span>
                ) : (
                  <span className="text-red-400 font-bold bg-red-400/10 px-2 py-0.5 rounded-full text-[11px]">
                    Agotado
                  </span>
                )}
              </div>
            )}

            {/* CONTENEDOR DE PRECIO Y BOTÓN RESPONSIVO */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
              <div className="flex flex-col">
                {/* Texto dinámico según el tipo: Renta o Venta */}
                <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">
                  {producto.tipoProducto?.nombre === "Servicio"
                    ? "Renta Mensual"
                    : "Precio de Venta"}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-extrabold text-zinc-100">
                    Q{Number(producto.precio || 0).toFixed(2)}
                  </span>
                  {/* Sufijo para servicios */}
                  {producto.tipoProducto?.nombre === "Servicio" && (
                    <span className="text-xs text-zinc-400 font-medium">
                      /mes
                    </span>
                  )}
                </div>
              </div>

              <Button
                disabled={
                  producto.tipoProducto?.nombre === "Físico" &&
                  producto.cantidad === 0
                }
                className={`w-full xl:w-auto font-bold px-4 py-2.5 h-auto text-sm rounded-xl transition-all border shrink-0 disabled:opacity-40 disabled:cursor-not-allowed text-center ${
                  producto.tipoProducto?.nombre === "Servicio"
                    ? "bg-zinc-800 hover:bg-blue-600 text-zinc-200 hover:text-white border-zinc-700/50 hover:border-transparent"
                    : "bg-zinc-800 hover:bg-emerald-500 text-zinc-200 hover:text-zinc-950 border-zinc-700/50 hover:border-transparent"
                }`}
              >
                {producto.tipoProducto?.nombre === "Servicio"
                  ? "Contratar"
                  : "Añadir al carro"}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
