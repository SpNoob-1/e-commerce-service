"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CatalogSkeleton } from "./skeletons";
import RentCalendarModal from "./RentCalendarModal";
import { useCartStore } from "@/app/store/useCartStore";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// ⚡ Interfaces ajustadas a la nueva estructura estructurada del backend
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
  ocupadoHasta: string | null;
}

interface MetaPaginacion {
  totalProductos: number;
  paginaActual: number;
  totalPaginas: number;
  limite: number;
}

interface RespuestaCatalogo {
  productos: Producto[];
  meta: MetaPaginacion;
}

interface UsuarioSesion {
  id: number;
  nombre: string;
  correo: string;
}

export default function CatalogList() {
  const addItem = useCartStore((state) => state.addItem);

  // 🚀 Estado para controlar la paginación tradicional
  const [paginaActual, setPaginaActual] = useState(1);
  const LIMITE_POR_PAGINA = 12;

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Producto | null>(null);
  const [enviandoInteresId, setEnviandoInteresId] = useState<number | null>(
    null,
  );

  // 🛡️ Estado para almacenar las solicitudes anti-spam
  const [serviciosSolicitados, setServiciosSolicitados] = useState<number[]>(
    [],
  );

  // 🛡️ Cargar solicitudes persistidas en el cliente
  useEffect(() => {
    const guardados = localStorage.getItem("servicios_solicitados_spam");
    if (guardados) {
      setServiciosSolicitados(JSON.parse(guardados));
    }
  }, []);

  // 🌟 useQuery adaptado: pasamos la página en el key para disparar re-fetches automáticos
  const { data, isLoading, isError, isFetching } = useQuery<RespuestaCatalogo>({
    queryKey: ["productos-catalogo", paginaActual],
    queryFn: async () => {
      const res = await fetch(
        `/api/usuarios/productos?page=${paginaActual}&limit=${LIMITE_POR_PAGINA}`,
      );
      if (!res.ok) throw new Error("Error cargando el catálogo");
      return res.json();
    },
    placeholderData: (previousData) => previousData, // Evita parpadeos molestos al cambiar de página
  });

  if (isLoading) return <CatalogSkeleton />;
  if (isError)
    return (
      <div className="text-red-500 text-center py-10">
        Error al cargar productos...
      </div>
    );

  // Desestructuramos de forma segura la respuesta envuelta del API nuevo
  const productos = data?.productos || [];
  const meta = data?.meta || { totalPaginas: 1, totalProductos: 0 };

  const handleActionClick = (prod: Producto) => {
    if (prod.tipoProducto.nombre === "Servicio") {
      setSelectedService(prod);
      setModalOpen(true);
    } else {
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

  const handleMeInteresaClick = async (prod: Producto) => {
    const sesion = localStorage.getItem("usuario_sesion");
    if (!sesion) {
      alert(
        "Por favor, inicia sesión en tu cuenta para poder enviar la solicitud.",
      );
      return;
    }

    if (serviciosSolicitados.includes(prod.id)) {
      alert("Ya registraste una solicitud para este servicio.");
      return;
    }

    const usuario: UsuarioSesion = JSON.parse(sesion);
    setEnviandoInteresId(prod.id);

    try {
      const res = await fetch("/api/usuarios/auth/servicios/interes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioCorreo: usuario.correo,
          usuarioNombre: usuario.nombre,
          productoNombre: prod.nombre,
          disponibleDesde: prod.ocupadoHasta,
        }),
      });

      if (res.ok) {
        alert("¡Interés registrado exitosamente!");
        const actualizados = [...serviciosSolicitados, prod.id];
        setServiciosSolicitados(actualizados);
        localStorage.setItem(
          "servicios_solicitados_spam",
          JSON.stringify(actualizados),
        );
      } else {
        alert("No se pudo procesar la solicitud.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEnviandoInteresId(null);
    }
  };

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

    alert(`¡Reserva para ${selectedService.nombre} configurada!`);
  };

  // Función auxiliar para scroll hacia arriba cuando se cambia de página
  const cambiarPagina = (nuevaPagina: number) => {
    setPaginaActual(nuevaPagina);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-zinc-50 tracking-tight">
          Catálogo de Soluciones
        </h2>
        {isFetching && (
          <span className="text-xs font-mono text-zinc-500 animate-pulse">
            Sincronizando página...
          </span>
        )}
      </div>

      {/* Grid del catálogo de productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {productos.map((prod) => {
          const esServicio = prod.tipoProducto.nombre === "Servicio";
          const hoy = new Date();
          const estaOcupado =
            esServicio &&
            prod.ocupadoHasta &&
            new Date(prod.ocupadoHasta) >= hoy;

          const yaSolicitado = serviciosSolicitados.includes(prod.id);

          return (
            <div
              key={prod.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-sm"
            >
              <div>
                {prod.imagenUrl && (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4 bg-zinc-950 group">
                    <Image
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      src={prod.imagenUrl}
                      alt={prod.nombre}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={Number(prod.id) <= 2}
                    />
                  </div>
                )}

                <div className="flex justify-between items-center mb-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      esServicio
                        ? estaOcupado
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : "bg-purple-950 text-purple-300 border border-purple-800"
                        : "bg-blue-950 text-blue-300 border border-blue-800"
                    }`}
                  >
                    {esServicio
                      ? estaOcupado
                        ? "Ocupado"
                        : "Servicio"
                      : prod.tipoProducto.nombre}
                  </span>

                  {!esServicio && (
                    <span
                      className={`text-xs ${prod.cantidad > 0 ? "text-emerald-400 font-medium" : "text-red-400 font-semibold"}`}
                    >
                      {prod.cantidad > 0 ? `${prod.cantidad} disp.` : "Agotado"}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2 min-h-[2.5rem]">
                  {prod.nombre}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-2 mt-1 mb-3">
                  {prod.descripcion}
                </p>

                {estaOcupado && prod.ocupadoHasta && (
                  <div className="text-[11px] text-amber-400 bg-amber-500/5 border border-amber-500/10 p-2 rounded-xl italic mb-3">
                    ⏳ Reservado. Próxima fecha disponible:{" "}
                    {new Date(prod.ocupadoHasta).toLocaleDateString("es-GT")}
                  </div>
                )}
              </div>

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

                {estaOcupado ? (
                  <Button
                    onClick={() => handleMeInteresaClick(prod)}
                    disabled={enviandoInteresId === prod.id || yaSolicitado}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all border ${
                      yaSolicitado
                        ? "bg-zinc-950 text-emerald-500 border-zinc-800 cursor-not-allowed"
                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700"
                    }`}
                  >
                    {enviandoInteresId === prod.id
                      ? "Enviando..."
                      : yaSolicitado
                        ? "✓ Ya solicitado"
                        : "📧 Me interesa este servicio"}
                  </Button>
                ) : (
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
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 🌟 BOTONERA DE PAGINACIÓN TRADICIONAL */}
      {meta.totalPaginas > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zinc-900 text-sm">
          <p className="text-zinc-500 font-mono text-xs">
            Mostrando página {meta.paginaActual} de {meta.totalPaginas} (
            {meta.totalProductos} productos en total)
          </p>

          <div className="flex items-center gap-2">
            {/* Botón Anterior */}
            <Button
              onClick={() => cambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs px-4 py-2 rounded-xl disabled:opacity-40"
            >
              ← Anterior
            </Button>

            {/* Números de páginas dinámicos */}
            <div className="flex items-center gap-1">
              {Array.from({ length: meta.totalPaginas }, (_, i) => i + 1).map(
                (n) => (
                  <button
                    key={n}
                    onClick={() => cambiarPagina(n)}
                    className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition-all ${
                      paginaActual === n
                        ? "bg-zinc-100 text-zinc-950"
                        : "bg-zinc-900/40 text-zinc-400 border border-zinc-800/60 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    {n}
                  </button>
                ),
              )}
            </div>

            {/* Botón Siguiente */}
            <Button
              onClick={() => cambiarPagina(paginaActual + 1)}
              disabled={paginaActual === meta.totalPaginas}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs px-4 py-2 rounded-xl disabled:opacity-40"
            >
              Siguiente →
            </Button>
          </div>
        </div>
      )}

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
