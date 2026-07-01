"use client";

import { useEffect, useState } from "react";

export default function AdminDashboardPage() {
  const [metricas, setMetricas] = useState({
    ingresosTotales: 0,
    ventasExitosas: 0,
    productosCriticos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Llamada al endpoint de administración real
    fetch("/api/admin/metricas")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setMetricas({
            ingresosTotales: data.ingresosTotales ?? 0,
            ventasExitosas: data.ventasExitosas ?? 0,
            productosCriticos: data.productosCriticos ?? 0,
          });
        }
      })
      .catch((err) => console.error("Error cargando métricas reales:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-sm text-zinc-400 font-mono">
        Calculando métricas del negocio en tiempo real...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panel de Control</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Bienvenido de vuelta. Aquí tienes un resumen del estado de tu negocio
          hoy.
        </p>
      </div>

      {/* Grid de Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Tarjeta 1: Ingresos */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Ingresos Totales
            </span>
            <span className="text-emerald-400 text-lg">💰</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight font-mono">
              Q{metricas.ingresosTotales.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Facturación total acumulada
          </p>
        </div>

        {/* Tarjeta 2: Ventas */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider font-sans">
              Órdenes Completadas
            </span>
            <span className="text-blue-400 text-lg">🛒</span>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold tracking-tight font-mono">
              {metricas.ventasExitosas}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Transacciones procesadas con éxito
          </p>
        </div>

        {/* Tarjeta 3: Alertas de Stock */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Alertas de Inventario
            </span>
            <span className="text-red-400 text-lg">⚠️</span>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold tracking-tight font-mono text-amber-500">
              {metricas.productosCriticos}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Productos físicos con 0 o 1 unidad
          </p>
        </div>
      </div>

      {/* Sección Informativa Inferior */}
      <div className="bg-zinc-900/20 border border-zinc-800/60 p-6 rounded-xl">
        <h3 className="text-sm font-semibold text-zinc-300">
          Próximos pasos recomendados
        </h3>
        <ul className="text-xs text-zinc-400 mt-3 space-y-2 list-disc list-inside">
          <li>
            Revisa la sección de{" "}
            <span className="text-emerald-400 font-medium">
              Productos e Inventario
            </span>{" "}
            si deseas reabastecer las laptops o periféricos sin existencias.
          </li>
          <li>
            Monitorea las órdenes de compra entrantes de tus usuarios en tiempo
            real.
          </li>
        </ul>
      </div>
    </div>
  );
}
