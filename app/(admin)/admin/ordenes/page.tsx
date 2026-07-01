"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// 🌟 Mapeos estáticos para IDs de base de datos
const MAPA_ESTADOS_ORDEN: Record<string, number> = {
  Pendiente: 1,
  Procesando: 2,
  Completado: 3,
  Cancelado: 4,
};

const MAPA_ESTADOS_DETALLE: Record<string, number> = {
  Pendiente: 1,
  Procesando: 2,
  Enviado: 3,
  Entregado: 4,
  Activo: 5,
  Cancelado: 6,
};

interface DetalleOrden {
  id: number;
  cantidad: number;
  precioUnit: number;
  fechaInicio: string | null;
  fechaFin: string | null;
  estadoDetalle: string;
  producto: {
    nombre: string;
    esServicio: boolean;
  };
}

interface OrdenAdmin {
  id: number;
  id_usuario: number;
  usuario_nombre: string;
  total: number;
  fecha: string;
  estado: string;
  detalles: DetalleOrden[];
}

export default function AdminOrdenesPage() {
  const queryClient = useQueryClient();
  const [idOrdenSeleccionada, setIdOrdenSeleccionada] = useState<number | null>(
    null,
  );

  // 📡 1. Cargar órdenes globales mediante TanStack Query
  const {
    data: ordenes = [],
    isLoading,
    error,
  } = useQuery<OrdenAdmin[]>({
    queryKey: ["admin-ordenes"],
    queryFn: async () => {
      const res = await fetch("/api/admin/ordenes");
      if (!res.ok) throw new Error("Error al obtener las órdenes globales.");
      return res.json();
    },
    refetchInterval: 8000,
  });

  // ⚡ 2. Mutación Unificada
  // ⚡ 2. Mutación Unificada conectada a la Ruta Plana de la API
  const actualizarOrdenMutation = useMutation({
    mutationFn: async ({
      ordenId,
      estadoOrdenId,
      detalles,
    }: {
      ordenId: number;
      estadoOrdenId?: number;
      detalles?: { id: number; estadoDetalleId: number }[];
    }) => {
      // 🚨 ¡AQUÍ ESTÁ EL TRUCO! La URL debe ser fija. Pasamos el ID dentro del body JSON.
      const res = await fetch("/api/admin/ordenes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordenId, estadoOrdenId, detalles }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "No se pudo actualizar la orden.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ordenes"] });
    },
    onError: (err: any) => {
      alert(`⚠️ Error de Sincronización: ${err.message}`);
    },
  });

  const ordenSeleccionada =
    ordenes.find((o) => o.id === idOrdenSeleccionada) || null;

  if (isLoading) {
    return (
      <div className="text-sm text-zinc-400 font-mono flex items-center gap-2 p-4 animate-pulse">
        <span>📦</span> Cargando historial logístico de ventas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl font-mono">
        ⚠️ Hubo un problema: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Órdenes y Ventas Globales
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Gestión logística granular e independiente para órdenes físicas,
          servicios y mixtas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* TABLA PRINCIPAL */}
        <div className="lg:col-span-2 bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-medium">
                  <th className="p-4">Nº Orden</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Ítems</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Estado Global</th>
                  <th className="p-4">Total</th>
                  <th className="p-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {ordenes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-zinc-500 font-mono text-xs"
                    >
                      No se encontraron órdenes registradas en la plataforma.
                    </td>
                  </tr>
                ) : (
                  ordenes.map((orden) => {
                    const totalItems = orden.detalles?.length || 0;
                    const esSeleccionada = idOrdenSeleccionada === orden.id;

                    return (
                      <tr
                        key={orden.id}
                        className={`transition-colors ${
                          esSeleccionada
                            ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                            : "hover:bg-zinc-900/30"
                        }`}
                      >
                        <td className="p-4 font-mono text-emerald-400 text-xs font-semibold">
                          #{orden.id}
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-zinc-200">
                            {orden.usuario_nombre}
                          </div>
                          <div className="text-xs text-zinc-500 font-mono">
                            ID: {orden.id_usuario}
                          </div>
                        </td>
                        <td className="p-4 text-xs font-mono text-zinc-400">
                          {totalItems} {totalItems === 1 ? "ítem" : "ítems"}
                        </td>
                        <td className="p-4 text-zinc-400 text-xs font-mono">
                          {orden.fecha}
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-mono font-medium ${
                              orden.estado === "Completado"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
                                : orden.estado === "Procesando"
                                  ? "bg-blue-950 text-blue-400 border border-blue-900"
                                  : orden.estado === "Cancelado"
                                    ? "bg-red-950 text-red-400 border border-red-900"
                                    : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {orden.estado}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-medium text-zinc-100">
                          Q{orden.total.toFixed(2)}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setIdOrdenSeleccionada(orden.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
                              esSeleccionada
                                ? "bg-emerald-500 text-zinc-950 border-emerald-400"
                                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700"
                            }`}
                          >
                            {esSeleccionada ? "⚡ Leyendo" : "🔎 Desglosar"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PANEL LATERAL */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-6 sticky top-6 shadow-xl">
          <div className="border-b border-zinc-800 pb-3">
            <h2 className="text-base font-bold text-zinc-200 font-mono">
              🔍 Desglose Logístico
            </h2>
            {ordenSeleccionada && (
              <div className="mt-2 flex items-center justify-between bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                <span className="text-xs font-mono text-zinc-400">
                  Estado Orden Global:
                </span>
                <select
                  value={ordenSeleccionada.estado}
                  disabled={actualizarOrdenMutation.isPending}
                  onChange={(e) =>
                    actualizarOrdenMutation.mutate({
                      ordenId: ordenSeleccionada.id,
                      estadoOrdenId: MAPA_ESTADOS_ORDEN[e.target.value],
                    })
                  }
                  className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="Pendiente">⏳ Pendiente</option>
                  <option value="Procesando">⚙️ Procesando</option>
                  <option value="Completado">✅ Completado</option>
                  <option value="Cancelado">❌ Cancelado</option>
                </select>
              </div>
            )}
          </div>

          {ordenSeleccionada ? (
            <div className="space-y-6">
              {/* PRODUCTOS FÍSICOS */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider font-mono flex items-center gap-1">
                  <span>📦</span> Productos Físicos
                </h3>
                {ordenSeleccionada.detalles?.filter(
                  (d) => !d.producto.esServicio,
                ).length === 0 ? (
                  <p className="text-xs text-zinc-600 italic px-2 font-mono">
                    No incluye productos físicos.
                  </p>
                ) : (
                  ordenSeleccionada.detalles
                    ?.filter((d) => !d.producto.esServicio)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-lg space-y-2 text-xs"
                      >
                        <div className="flex justify-between font-medium">
                          <span className="text-zinc-200 font-semibold">
                            {item.producto.nombre}
                          </span>
                          <span className="text-emerald-400 font-mono">
                            Q{(item.precioUnit * item.cantidad).toFixed(2)}
                          </span>
                        </div>
                        <div className="text-zinc-500 font-mono text-[11px] flex gap-4">
                          <span>Cant: {item.cantidad}</span>
                          <span>Unit: Q{item.precioUnit.toFixed(2)}</span>
                        </div>
                        <div className="pt-2 flex items-center justify-between gap-2 border-t border-zinc-800/50 mt-1">
                          <span className="text-zinc-500 font-mono text-[11px]">
                            Envío item:
                          </span>
                          <select
                            value={item.estadoDetalle}
                            disabled={actualizarOrdenMutation.isPending}
                            onChange={(e) =>
                              actualizarOrdenMutation.mutate({
                                ordenId: ordenSeleccionada.id,
                                detalles: [
                                  {
                                    id: item.id,
                                    estadoDetalleId:
                                      MAPA_ESTADOS_DETALLE[e.target.value],
                                  },
                                ],
                              })
                            }
                            className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-300 font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                          >
                            <option value="Pendiente">⏳ Pendiente</option>
                            <option value="Procesando">⚙️ Procesando</option>
                            <option value="Enviado">🚚 Enviado</option>
                            <option value="Entregado">✅ Entregado</option>
                            <option value="Cancelado">❌ Cancelado</option>
                          </select>
                        </div>
                      </div>
                    ))
                )}
              </div>

              {/* SERVICIOS */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider font-mono flex items-center gap-1">
                  <span>⚡</span> Servicios / Rentas
                </h3>
                {ordenSeleccionada.detalles?.filter(
                  (d) => d.producto.esServicio,
                ).length === 0 ? (
                  <p className="text-xs text-zinc-600 italic px-2 font-mono">
                    No incluye servicios contratados.
                  </p>
                ) : (
                  ordenSeleccionada.detalles
                    ?.filter((d) => d.producto.esServicio)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-lg space-y-2 text-xs"
                      >
                        <div className="flex justify-between font-medium">
                          <span className="text-zinc-200 font-semibold">
                            {item.producto.nombre}
                          </span>
                          <span className="text-emerald-400 font-mono">
                            Q{(item.precioUnit * item.cantidad).toFixed(2)}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono space-y-0.5 bg-zinc-900/40 p-1.5 rounded border border-zinc-800/40">
                          <div>
                            📅 Inicio:{" "}
                            {item.fechaInicio ? item.fechaInicio : "Inmediato"}
                          </div>
                          <div>
                            📅 Expira:{" "}
                            {item.fechaFin ? item.fechaFin : "Sin vigencia"}
                          </div>
                        </div>
                        <div className="pt-2 flex items-center justify-between gap-2 border-t border-zinc-800/50 mt-1">
                          <span className="text-zinc-500 font-mono text-[11px]">
                            Suscripción:
                          </span>
                          <select
                            value={item.estadoDetalle}
                            disabled={actualizarOrdenMutation.isPending}
                            onChange={(e) =>
                              actualizarOrdenMutation.mutate({
                                ordenId: ordenSeleccionada.id,
                                detalles: [
                                  {
                                    id: item.id,
                                    estadoDetalleId:
                                      MAPA_ESTADOS_DETALLE[e.target.value],
                                  },
                                ],
                              })
                            }
                            className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-300 font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                          >
                            <option value="Pendiente">⏳ Pendiente</option>
                            <option value="Activo">⚡ Activo</option>
                            <option value="Completado">✅ Completado</option>
                            <option value="Cancelado">❌ Cancelado</option>
                          </select>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-600 text-xs italic font-mono border border-dashed border-zinc-800 rounded-lg">
              A la espera de selección...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
