"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { useCartStore, CartItem } from "@/app/store/useCartStore";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { CalendarDays, MoveLeftIcon, Trash2 } from "@hugeicons/core-free-icons";
import { useMutation } from "@tanstack/react-query";

// 2. Creamos el componente con la lógica normal, pero le quitamos el useEffect e isClient
function CartPage() {
  const { items, removeItem, clearCart, updateQuantity } = useCartStore();

  // Calculamos el subtotal total del carrito
  const subtotalCarrito = items.reduce((sum, item) => {
    if (item.tipo === "Físico") {
      return sum + item.precio * (item.cantidadSeleccionada || 1);
    } else {
      return sum + item.precio;
    }
  }, 0);

  const impuestoEstimado = subtotalCarrito * 0.12;
  const totalFinal = subtotalCarrito + impuestoEstimado;

  const handleAddQuantity = (item: CartItem) => {
    if (item.tipo === "Físico") {
      const cantidadActual = item.cantidadSeleccionada || 1;
      const maxDisponible = item.stockDisponible || 0;

      if (cantidadActual < maxDisponible) {
        updateQuantity(item.id, item.tipo, cantidadActual + 1);
      }
    }
  };

  const handleRemoveQuantity = (item: CartItem) => {
    if (item.tipo === "Físico") {
      const cantidadActual = item.cantidadSeleccionada || 1;

      if (cantidadActual > 1) {
        updateQuantity(item.id, item.tipo, cantidadActual - 1);
      } else {
        // Si llega a 0 al presionar menos, lo removemos del carrito por completo
        removeItem(item.id, item.tipo);
      }
    }
  };

  const checkoutMutation = useMutation({
    mutationFn: async (payload: { usuarioId: number; items: any[] }) => {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        // Si la API responde con error, lanzamos una excepción para que useMutation sepa que falló
        throw new Error(data.error || "Hubo un problema al procesar la orden");
      }

      return data; // Si todo sale bien, retorna los datos de la orden
    },
    onSuccess: (data) => {
      // Envolvemos data.total en Number() para asegurar que no sea un string
      const totalFormateado = Number(data.total).toFixed(2);

      alert(`¡Orden #${data.ordenId} procesada con éxito! Q${totalFormateado}`);
      clearCart();
    },
    onError: (error: any) => {
      // ❌ Qué hacer si la API o la base de datos rebotan la orden
      alert(`❌ Error en el checkout: ${error.message}`);
    },
  });

  // Función puente para disparar la mutación al hacer clic
  const handleConfirmarOrden = () => {
    // Simulamos el ID de usuario 1 por el momento
    checkoutMutation.mutate({
      usuarioId: 1,
      items,
    });
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-4 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Encabezado */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-5">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors text-sm"
          >
            <HugeiconsIcon icon={MoveLeftIcon} size={16} />
            Volver al catálogo
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50">
            Resumen del Carrito
          </h1>
          <Button
            onClick={clearCart}
            variant="ghost"
            className="text-zinc-500 hover:text-red-400 gap-2 text-xs"
          >
            <HugeiconsIcon icon={Trash2} size={14} />
            Vaciar Carrito
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-24 space-y-4 border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-950/50">
            <div className="text-5xl">🛒</div>
            <p className="text-zinc-400 text-sm">
              Tu carrito está completamente vacío.
            </p>
            <Link href="/">
              <Button className="bg-zinc-100 text-zinc-950 font-bold hover:bg-zinc-200 mt-2 rounded-full px-8">
                Ir a buscar algo genial
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Lista de Items */}
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => (
                <div
                  key={`${item.tipo}-${item.id}`}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex gap-5 items-center hover:border-zinc-700 transition-colors"
                >
                  <div className="relative w-24 h-24 bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center text-zinc-700">
                    {item.imagenUrl ? (
                      <Image
                        src={item.imagenUrl}
                        alt={item.nombre}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <span className="text-xs">Sin foto</span>
                    )}
                    <span
                      className={`absolute top-1 left-1 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        item.tipo === "Servicio"
                          ? "bg-purple-950 text-purple-300"
                          : "bg-blue-950 text-blue-300"
                      }`}
                    >
                      {item.tipo}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2">
                        {item.nombre}
                      </h3>
                      <button
                        onClick={() => removeItem(item.id, item.tipo)}
                        className="text-zinc-600 hover:text-red-500 p-1"
                      >
                        <HugeiconsIcon icon={Trash2} size={20} />
                      </button>
                    </div>

                    {item.tipo === "Físico" ? (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 border border-zinc-700 rounded-full p-1 bg-zinc-950/50">
                          <button
                            onClick={() => handleRemoveQuantity(item)}
                            className="w-7 h-7 flex items-center justify-center text-zinc-100 hover:bg-zinc-800 rounded-full"
                          >
                            -
                          </button>
                          <span className="text-sm font-bold text-zinc-100 w-6 text-center">
                            {item.cantidadSeleccionada || 1}
                          </span>
                          <button
                            onClick={() => handleAddQuantity(item)}
                            disabled={
                              (item.cantidadSeleccionada || 1) >=
                              (item.stockDisponible || 0)
                            }
                            className="w-7 h-7 flex items-center justify-center text-zinc-100 hover:bg-zinc-800 disabled:opacity-40 rounded-full"
                          >
                            +
                          </button>
                        </div>

                        {/* 💡 AQUÍ ESTÁ EL TRUCO DINÁMICO: Restamos lo seleccionado al stock total */}
                        <span className="text-xs text-zinc-500">
                          {Math.max(
                            0,
                            (item.stockDisponible || 0) -
                              (item.cantidadSeleccionada || 1),
                          )}{" "}
                          disponibles
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-purple-300 border border-purple-800/60 bg-purple-950/40 px-3 py-1.5 rounded-xl">
                        <HugeiconsIcon icon={CalendarDays} size={14} />
                        <span>
                          Renta:{" "}
                          {item.fechaInicio &&
                            format(
                              new Date(item.fechaInicio),
                              "dd/MM/yyyy",
                            )}{" "}
                          →{" "}
                          {item.fechaFin &&
                            format(new Date(item.fechaFin), "dd/MM/yyyy")}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-right flex flex-col pl-4 min-w-[110px]">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">
                      Subtotal
                    </span>
                    <span className="text-lg font-extrabold text-zinc-50">
                      Q
                      {(item.tipo === "Físico"
                        ? item.precio * (item.cantidadSeleccionada || 1)
                        : item.precio
                      ).toFixed(2)}
                    </span>
                    <span className="text-xs text-zinc-400">
                      Q{item.precio.toFixed(2)}{" "}
                      {item.tipo === "Servicio" ? "/ mes" : "/ u."}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen del Checkout */}
            <div className="lg:col-span-1">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-xl sticky top-28">
                <h3 className="text-lg font-bold text-zinc-50 border-b border-zinc-800 pb-4">
                  Detalle de Pago
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-zinc-300">
                    <span>Subtotal de compra ({items.length} ítems)</span>
                    <span className="font-semibold text-zinc-100">
                      Q{subtotalCarrito.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Impuestos estimados (12% IVA)</span>
                    <span>Q{impuestoEstimado.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-zinc-800 pt-3 flex justify-between text-base font-bold text-zinc-50 mt-1">
                    <span>Total Final (Q)</span>
                    <span className="text-2xl font-extrabold tracking-tight">
                      Q{totalFinal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleConfirmarOrden}
                  disabled={checkoutMutation.isPending}
                  className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-sm py-3 rounded-xl gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></span>
                      Procesando tu Orden...
                    </div>
                  ) : (
                    "Confirmar y Procesar Orden 🚀"
                  )}
                </Button>

                <p className="text-[10px] text-zinc-600 text-center px-2">
                  Al confirmar, pasarás a la validación final de stock y
                  disponibilidad en tiempo real antes del pago.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default dynamic(() => Promise.resolve(CartPage), {
  ssr: false,
  loading: () => (
    <div className="text-zinc-500 p-10 text-center bg-black min-h-screen">
      Cargando carrito de compras...
    </div>
  ),
});
