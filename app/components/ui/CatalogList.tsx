"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CatalogSkeleton } from "./skeletons"; // Tu skeleton independiente
import RentCalendarModal from "./RentCalendarModal";
import { useCartStore } from "@/app/store/useCartStore";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// Interfaz para mapear la respuesta de tu API/Prisma
interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  imagenUrl: string | null;
  tipoProducto: {
    nombre: string; // "Físico" o "Servicio"
  };
}

export default function CatalogList() {
  // 1. Traemos la función de añadir ítems desde Zustand
  const addItem = useCartStore((state) => state.addItem);

  // Estado para controlar el modal de fechas de servicios
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Producto | null>(null);

  // 2. Tu Query que jala los datos de la API (ajusta la ruta según tu endpoint real)
  const {
    data: productos,
    isLoading,
    isError,
  } = useQuery<Producto[]>({
    queryKey: ["productos-catalogo"],
    queryFn: async () => {
      const res = await fetch("/api/productos"); // O la ruta que estés usando
      if (!res.ok) throw new Error("Error cargando el catálogo");
      return res.json();
    },
  });

  if (isLoading) return <CatalogSkeleton />;
  if (isError)
    return (
      <div className="text-red-500 text-center py-10">
        Error al cargar productos...
      </div>
    );

  // Manejador para cuando se hace clic en el botón de la tarjeta
  const handleActionClick = (prod: Producto) => {
    if (prod.tipoProducto.nombre === "Servicio") {
      // Si es servicio, abrimos el calendario
      setSelectedService(prod);
      setModalOpen(true);
    } else {
      // Si es producto físico, va directo al carrito global 🛒
      addItem({
        id: prod.id,
        nombre: prod.nombre,
        precio: Number(prod.precio),
        imagenUrl: prod.imagenUrl,
        tipo: "Físico",
        stockDisponible: prod.cantidad,
      });
      alert(`¡${prod.nombre} añadido al carrito!`);
    }
  };

  // Manejador cuando el modal devuelve las fechas confirmadas
  const handleConfirmRental = (fechaInicio: string, fechaFin: string) => {
    if (!selectedService) return;

    addItem({
      id: selectedService.id,
      nombre: selectedService.nombre,
      precio: Number(selectedService.precio),
      imagenUrl: selectedService.imagenUrl,
      tipo: "Servicio",
      fechaInicio,
      fechaFin,
    });

    alert(`¡Reserva para ${selectedService.nombre} configurada y añadida!`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-zinc-50 tracking-tight">
        Catálogo de Soluciones
      </h2>

      {/* Grid Responsivo de Tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {productos?.map((prod) => {
          const esServicio = prod.tipoProducto.nombre === "Servicio";

          return (
            <div
              key={prod.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-sm"
            >
              <div>
                {prod.imagenUrl && (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4 bg-zinc-950 group">
                    <Image
                      className=" object-cover group-hover:scale-105 transition-transform duration-500" // Efecto de zoom suave al pasar el mouse
                      src={prod.imagenUrl}
                      alt={prod.nombre}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={Number(prod.id) <= 2}
                    />
                  </div>
                )}

                {/* Etiquetas dinámicas de Categoría/Stock */}
                <div className="flex justify-between items-center mb-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      esServicio
                        ? "bg-purple-950 text-purple-300 border border-purple-800"
                        : "bg-blue-950 text-blue-300 border border-blue-800"
                    }`}
                  >
                    {prod.tipoProducto.nombre}
                  </span>

                  {!esServicio && (
                    <span
                      className={`text-xs ${prod.cantidad > 0 ? "text-emerald-400 font-medium" : "text-red-400 font-semibold"}`}
                    >
                      {prod.cantidad > 0 ? `${prod.cantidad} disp.` : "Agotado"}
                    </span>
                  )}
                </div>

                {/* Título estandarizado a dos líneas fijas */}
                <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2 min-h-[2.5rem]">
                  {prod.nombre}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-2 mt-1 mb-4">
                  {prod.descripcion}
                </p>
              </div>

              {/* Sección Inferior de Precios y Botón */}
              <div className="space-y-3 pt-2 border-t border-zinc-800/50">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">
                    Precio
                  </span>
                  <span className="text-base font-extrabold text-zinc-50">
                    Q{Number(prod.precio).toFixed(2)}
                    {esServicio && (
                      <span className="text-xs font-normal text-zinc-400">
                        {" "}
                        / mes
                      </span>
                    )}
                  </span>
                </div>

                <Button
                  onClick={() => handleActionClick(prod)}
                  disabled={!esServicio && prod.cantidad <= 0}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    esServicio
                      ? "bg-purple-600 hover:bg-purple-500 text-white"
                      : "bg-zinc-100 hover:bg-zinc-200 text-zinc-950 disabled:bg-zinc-800 disabled:text-zinc-600"
                  }`}
                >
                  {esServicio ? "Contratar Servicio" : "Añadir al Carrito"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Inyección del Modal del Calendario */}
      {selectedService && (
        <RentCalendarModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedService(null);
          }}
          productoNombre={selectedService.nombre}
          precioMensual={Number(selectedService.precio)}
          onConfirm={handleConfirmRental}
        />
      )}
    </div>
  );
}
