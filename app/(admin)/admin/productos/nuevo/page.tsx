"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "@/lib/uploadthing";
import Image from "next/image";

interface Categoria {
  id: number;
  nombre: string;
}

export default function NuevoProductoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Estado simplificado del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    cantidad: "", // Stock
    imagenUrl: "",
    tipoProductoId: "", // Guardará el ID dinámico de la categoría elegida
  });

  // 🚀 1. OBTENER LAS CATEGORÍAS REALES CON USEQUERY
  const { data: categorias = [], isLoading: cargandoCategorias } = useQuery<
    Categoria[]
  >({
    queryKey: ["admin-categorias"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categorias");
      if (!res.ok) throw new Error("No se pudieron cargar las categorías.");
      return res.json();
    },
  });

  // 🚀 2. CREAR LA MUTACIÓN PARA GUARDAR EL PRODUCTO
  const crearProductoMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/admin/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar el producto");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalida el inventario para forzar actualización de los datos en la tabla principal
      queryClient.invalidateQueries({ queryKey: ["admin-productos"] });
      router.push("/admin/productos");
      router.refresh();
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  // Buscamos si la categoría seleccionada actualmente se comporta como un servicio continuo
  const categoriaSeleccionadaObj = categorias.find(
    (c) => c.id === Number(formData.tipoProductoId),
  );
  const esServicio = categoriaSeleccionadaObj
    ? ["Servicios Técnicos", "Consultorías"].includes(
        categoriaSeleccionadaObj.nombre,
      )
    : false;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.nombre || !formData.precio || !formData.tipoProductoId) {
      setError("El nombre, precio y categoría son estrictamente obligatorios.");
      return;
    }

    if (!formData.imagenUrl) {
      setError("Por favor, sube una imagen para el ítem antes de registrarlo.");
      return;
    }

    // Construimos el payload de manera dinámica basándonos en la categoría real
    const payload = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      precio: parseFloat(formData.precio),
      cantidad: esServicio ? 0 : parseInt(formData.cantidad || "0"),
      imagenUrl: formData.imagenUrl,
      tipoProductoId: Number(formData.tipoProductoId),
    };

    crearProductoMutation.mutate(payload);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Cabecera de Retorno */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Agregar Nuevo Ítem (Admin)
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Introduce los detalles para el catálogo global.
          </p>
        </div>
        <Link
          href="/admin/productos"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          🗙 Cancelar
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl shadow-xl"
      >
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Nombre del Producto / Servicio
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej. Cable de Red Cat6 10m o Asesoría en Seguridad Web"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Categoría Base (Base de Datos)
            </label>
            <select
              name="tipoProductoId"
              value={formData.tipoProductoId}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
              required
            >
              <option value="" disabled>
                {cargandoCategorias
                  ? "Cargando categorías..."
                  : "Selecciona una categoría..."}
              </option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {["Servicios Técnicos", "Consultorías"].includes(cat.nombre)
                    ? "⚙️"
                    : "📦"}{" "}
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Precio (en Quetzales)
            </label>
            <input
              type="number"
              name="precio"
              step="0.01"
              value={formData.precio}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
              required
            />
          </div>
        </div>

        {/* 🌟 Campo Dinámico Interactivo: Se oculta automáticamente si la categoría mapea un servicio */}
        {!esServicio && formData.tipoProductoId !== "" && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Stock Inicial (Unidades Físicas)
            </label>
            <input
              type="number"
              name="cantidad"
              value={formData.cantidad}
              onChange={handleChange}
              placeholder="Ej. 25"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
              required
            />
          </div>
        )}

        {esServicio && (
          <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-lg text-zinc-400 text-xs italic">
            💡 Has seleccionado un servicio continuo. El sistema ignorará el
            control logístico de inventario físico y activará la reserva por
            calendario en el catálogo.
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Descripción o Especificaciones
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows={3}
            placeholder="Detalla las especificaciones técnicas, alcances del servicio o características del ítem..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
          />
        </div>

        {/* Carga de Imagen */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400 block">
            Imagen de Catálogo
          </label>

          {formData.imagenUrl ? (
            <div className="relative w-full h-24 max-h-24 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
              <Image
                src={formData.imagenUrl}
                alt="Previsualización"
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, imagenUrl: "" }))
                }
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-zinc-950 font-bold p-1 rounded-full text-[10px] transition-colors z-10"
              >
                ✕ Eliminar
              </button>
            </div>
          ) : (
            <UploadDropzone
              endpoint="imageUploader"
              config={{ mode: "auto" }}
              appearance={{
                container:
                  "py-2 px-4 min-h-[90px] h-24 border border-dashed border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 transition-colors rounded-xl flex flex-col items-center justify-center",
                label: "text-emerald-400 text-xs font-medium my-1",
                button:
                  "bg-emerald-600 text-zinc-950 text-xs font-semibold px-3 py-1 rounded mt-1 ut-ready:bg-emerald-500 ut-uploading:bg-zinc-700",
                allowedContent: "text-[10px] text-zinc-500 hidden",
              }}
              onClientUploadComplete={(res) => {
                const url = res?.[0]?.url;
                if (url) {
                  setFormData((prev) => ({ ...prev, imagenUrl: url }));
                  alert("¡Imagen vinculada exitosamente!");
                }
              }}
              onUploadError={(error: Error) => {
                alert(`Error al subir imagen: ${error.message}`);
              }}
            />
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={crearProductoMutation.isPending || cargandoCategorias}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-bold py-2 rounded-lg transition-colors"
          >
            {crearProductoMutation.isPending
              ? "Guardando ítem en MySQL..."
              : "💾 Registrar en Catálogo"}
          </Button>
        </div>
      </form>
    </div>
  );
}
