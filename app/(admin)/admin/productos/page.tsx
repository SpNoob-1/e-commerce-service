"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "@/lib/uploadthing";
import Image from "next/image";

interface ProductoAdmin {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: string | number;
  cantidad: number;
  activo: boolean;
  tipoProductoId: number;
  imagenUrl: string;
}

interface MetaPaginacion {
  totalProductos: number;
  paginaActual: number;
  totalPaginas: number;
  limite: number;
}

interface RespuestaProductos {
  productos: ProductoAdmin[];
  meta: MetaPaginacion;
}

export default function AdminProductosPage() {
  const queryClient = useQueryClient();
  const [paginaActual, setPaginaActual] = useState(1);
  const LIMITE_ADMIN = 10;

  // Estados para controlar el Modal de Edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState<ProductoAdmin | null>(
    null,
  );

  // 🚀 OBTENER PRODUCTOS CON USEQUERY
  const { data, isLoading, isFetching } = useQuery<RespuestaProductos>({
    queryKey: ["admin-productos", paginaActual],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/productos?page=${paginaActual}&limit=${LIMITE_ADMIN}`,
      );
      if (!res.ok) throw new Error("Error al cargar los productos");
      return res.json();
    },
    placeholderData: (previousData) => previousData, // Mantiene los datos viejos en pantalla mientras carga la nueva página (evita parpadeos)
  });

  // 🔄 MUTACIÓN GENÉRICA PARA ACTUALIZAR (Stock, Estado, Edición)
  const actualizarProductoMutation = useMutation({
    mutationFn: async (payload: Partial<ProductoAdmin> & { id: number }) => {
      const res = await fetch("/api/admin/productos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error en el servidor de administración");
      return res.json();
    },
    onSuccess: () => {
      // Invalida la caché para forzar un re-fetch automático
      queryClient.invalidateQueries({ queryKey: ["admin-productos"] });
    },
    onError: (error) => {
      alert(`Operación fallida: ${error.message}`);
    },
  });

  // Ajustar stock rápido desde los botones + / -
  const handleAjustarStock = (id: number, nuevaCantidad: number) => {
    if (nuevaCantidad < 0) return;
    actualizarProductoMutation.mutate({ id, cantidad: nuevaCantidad });
  };

  // 🗑️ ELIMINACIÓN LÓGICA (Soft Delete)
  const handleEliminarProducto = (id: number, nombre: string) => {
    const confirmar = confirm(
      `¿Estás seguro de que deseas retirar "${nombre}" del catálogo?`,
    );
    if (!confirmar) return;
    actualizarProductoMutation.mutate({ id, activo: false });
  };

  // Guardar edición completa desde el Modal
  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoAEditar) return;

    actualizarProductoMutation.mutate(productoAEditar, {
      onSuccess: () => {
        setIsModalOpen(false);
        setProductoAEditar(null);
      },
    });
  };

  // Desestructuramos con fallbacks seguros
  const productos = data?.productos || [];
  const meta = data?.meta || {
    totalProductos: 0,
    paginaActual: 1,
    totalPaginas: 1,
    limite: LIMITE_ADMIN,
  };

  if (isLoading) {
    return (
      <div className="text-sm text-zinc-400 p-6 font-mono">
        Cargando inventario de administración...
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Cabecera del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Productos e Inventario (Admin)
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Controla el stock disponible de tus equipos físicos y la
            disponibilidad de tus servicios.
          </p>
        </div>
        <Link href="/admin/productos/nuevo">
          <Button className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold gap-2 self-start">
            <span>➕</span> Agregar Producto o Servicio
          </Button>
        </Link>
      </div>

      {/* Tabla */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-medium">
                <th className="p-4 hidden md:table-cell">ID</th>
                <th className="p-4">Nombre del Item</th>
                <th className="p-4 hidden sm:table-cell">Tipo</th>
                <th className="p-4">Precio</th>
                <th className="p-4 text-center">Stock / Control</th>
                <th className="p-4 text-center hidden md:table-cell">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y divide-zinc-800/60 ${isFetching || actualizarProductoMutation.isPending ? "opacity-60" : ""}`}
            >
              {productos.map((producto) => {
                const esServicio = producto.tipoProductoId === 6;
                const sinStock = producto.cantidad === 0;

                return (
                  <tr
                    key={producto.id}
                    className="hover:bg-zinc-900/30 transition-colors group"
                  >
                    <td className="p-4 font-mono text-zinc-500 text-xs hidden md:table-cell">
                      #{producto.id}
                    </td>
                    <td className="p-4 font-medium text-zinc-200 max-w-[120px] sm:max-w-none truncate">
                      {producto.nombre}
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium border ${esServicio ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}
                      >
                        {esServicio ? "Servicio" : "Físico"}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-300 whitespace-nowrap">
                      Q{Number(producto.precio).toFixed(2)}
                      {esServicio && (
                        <span className="text-zinc-500 text-xs"> /mes</span>
                      )}
                    </td>
                    <td className="p-4">
                      {esServicio ? (
                        <div className="text-center text-xs text-zinc-500 italic">
                          Continuo
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 sm:gap-3">
                          <button
                            disabled={actualizarProductoMutation.isPending}
                            onClick={() =>
                              handleAjustarStock(
                                producto.id,
                                producto.cantidad - 1,
                              )
                            }
                            className="w-6 h-6 sm:w-7 sm:h-7 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 rounded flex items-center justify-center font-bold border border-zinc-700 transition-colors"
                          >
                            -
                          </button>
                          <span
                            className={`w-7 sm:w-10 text-center font-mono text-xs sm:text-sm font-semibold ${sinStock ? "text-red-400 bg-red-500/10 px-1 rounded border border-red-500/20" : "text-zinc-200"}`}
                          >
                            {producto.cantidad}
                          </span>
                          <button
                            disabled={actualizarProductoMutation.isPending}
                            onClick={() =>
                              handleAjustarStock(
                                producto.id,
                                producto.cantidad + 1,
                              )
                            }
                            className="w-6 h-6 sm:w-7 sm:h-7 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 rounded flex items-center justify-center font-bold border border-zinc-700 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center hidden md:table-cell">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${producto.activo ? "text-emerald-400" : "text-zinc-500"}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${producto.activo ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`}
                        />
                        {producto.activo ? "Visible" : "Oculto"}
                      </span>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setProductoAEditar(producto);
                            setIsModalOpen(true);
                          }}
                          className="text-xs px-2 sm:px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                          title="Editar"
                        >
                          ✏️ <span className="hidden sm:inline">Editar</span>
                        </button>
                        <button
                          onClick={() =>
                            handleEliminarProducto(producto.id, producto.nombre)
                          }
                          className="text-xs px-2 sm:px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 transition-colors"
                          title="Eliminar"
                        >
                          🗑️ <span className="hidden sm:inline">Eliminar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {productos.length === 0 && (
          <div className="p-8 text-center text-sm text-zinc-500 font-mono">
            No se encontraron productos registrados en la base de datos.
          </div>
        )}

        {/* BOTONERA DE PAGINACIÓN */}
        {meta.totalPaginas > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-zinc-800 bg-zinc-900/20 text-xs font-mono text-zinc-400">
            <p>
              Filas {(paginaActual - 1) * LIMITE_ADMIN + 1} -{" "}
              {Math.min(paginaActual * LIMITE_ADMIN, meta.totalProductos)} de{" "}
              {meta.totalProductos}
            </p>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
                disabled={paginaActual === 1 || isFetching}
                className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 text-zinc-200 text-[11px] px-3 py-1 h-8 rounded-lg"
              >
                Anterior
              </Button>

              <span className="text-zinc-200 px-2 font-bold font-sans">
                {paginaActual} / {meta.totalPaginas}
              </span>

              <Button
                onClick={() =>
                  setPaginaActual((prev) =>
                    Math.min(prev + 1, meta.totalPaginas),
                  )
                }
                disabled={paginaActual === meta.totalPaginas || isFetching}
                className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 text-zinc-200 text-[11px] px-3 py-1 h-8 rounded-lg"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL FLOTANTE DE EDICIÓN */}
      {isModalOpen && productoAEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-xl shadow-2xl p-6 space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h2 className="text-lg font-bold text-zinc-100">
                Editar Producto
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-4">
              {/* Imagen */}
              <div>
                <label className="text-xs text-zinc-400 font-medium block mb-1.5">
                  Imagen del Item
                </label>
                {productoAEditar.imagenUrl ? (
                  <div className="relative w-full h-24 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900">
                    <Image
                      src={productoAEditar.imagenUrl}
                      alt="Previsualización"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setProductoAEditar({
                          ...productoAEditar,
                          imagenUrl: "",
                        })
                      }
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-zinc-950 font-bold px-2 py-0.5 rounded text-[10px] transition-colors z-10"
                    >
                      ✕ Cambiar
                    </button>
                  </div>
                ) : (
                  <UploadDropzone
                    endpoint="imageUploader"
                    config={{ mode: "auto" }}
                    appearance={{
                      container:
                        "py-2 px-4 min-h-[90px] h-24 border border-dashed border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 transition-colors rounded-lg flex flex-col items-center justify-center",
                      label: "text-emerald-400 text-xs font-medium my-1",
                      button:
                        "bg-emerald-600 text-zinc-950 text-xs font-semibold px-3 py-1 rounded mt-1 ut-ready:bg-emerald-500 ut-uploading:bg-zinc-700",
                      allowedContent: "text-[10px] text-zinc-500 hidden",
                    }}
                    onClientUploadComplete={(res) => {
                      const url = res?.[0]?.url;
                      if (url) {
                        setProductoAEditar({
                          ...productoAEditar,
                          imagenUrl: url,
                        });
                        alert("¡Nueva foto vinculada!");
                      }
                    }}
                    onUploadError={(error: Error) =>
                      alert(`Error: ${error.message}`)
                    }
                  />
                )}
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-medium block mb-1">
                  Nombre del Item
                </label>
                <input
                  type="text"
                  value={productoAEditar.nombre}
                  onChange={(e) =>
                    setProductoAEditar({
                      ...productoAEditar,
                      nombre: e.target.value,
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-medium block mb-1">
                  Descripción
                </label>
                <textarea
                  value={productoAEditar.descripcion || ""}
                  onChange={(e) =>
                    setProductoAEditar({
                      ...productoAEditar,
                      descripcion: e.target.value,
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 h-16 resize-none focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 font-medium block mb-1">
                    Precio (Q)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productoAEditar.precio}
                    onChange={(e) =>
                      setProductoAEditar({
                        ...productoAEditar,
                        precio: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                {productoAEditar.tipoProductoId !== 6 && (
                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1">
                      Stock Actual
                    </label>
                    <input
                      type="number"
                      value={productoAEditar.cantidad}
                      onChange={(e) =>
                        setProductoAEditar({
                          ...productoAEditar,
                          cantidad: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Visibilidad Switch */}
              <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
                <div>
                  <span className="text-sm font-medium text-zinc-200 block">
                    Visibilidad en Catálogo
                  </span>
                  <span className="text-xs text-zinc-500">
                    Ocultar o mostrar el ítem a los usuarios.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setProductoAEditar({
                      ...productoAEditar,
                      activo: !productoAEditar.activo,
                    })
                  }
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${productoAEditar.activo ? "bg-emerald-500" : "bg-zinc-700"}`}
                >
                  <div
                    className={`bg-zinc-950 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${productoAEditar.activo ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actualizarProductoMutation.isPending}
                  className="px-4 py-2 text-xs bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 text-zinc-950 font-semibold rounded-lg transition-colors"
                >
                  {actualizarProductoMutation.isPending
                    ? "Guardando..."
                    : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
