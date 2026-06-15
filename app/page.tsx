"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CatalogList from "./components/ui/CatalogList";

// 🏛️ 2. COMPONENTE PRINCIPAL (Estructura de la página y Suspense)
export default function CatalogPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 🎯 ENCABEZADO DEL CATÁLOGO */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-8 border-b border-zinc-900 mb-8">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-100 bg-gradient-to-r  from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Catálogo de Soluciones
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Explora nuestros componentes físicos avanzados y servicios
              expertos.
            </p>
          </div>

          <Link href="/login" className="shrink-0">
            <Button
              variant="outline"
              className="w-full sm:w-auto font-bold px-5 py-2.5 h-auto text-sm rounded-xl border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50 transition-all duration-200"
            >
              Iniciar Sesión
            </Button>
          </Link>
        </div>

        {/* 📦 EL CATÁLOGO REAL (Controlado por useQuery e isLoading) */}
        <CatalogList />

        {/* 📑 PIE DE PÁGINA ("Otros Componentes") */}
        <div className="mt-20 pt-10 border-t border-zinc-900">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-lg font-bold text-zinc-400 uppercase tracking-wider shrink-0 text-xs">
              Otros Componentes
            </h2>
            {/* Una línea sutil que cruza la pantalla de forma elegante */}
            <div className="h-[1px] w-full bg-zinc-900" />
          </div>

          {/* Aquí puedes meter más adelante un mini-carrusel, texto extra o dejarlo limpio */}
          <p className="text-sm text-zinc-500 italic">
            ¿No encuentras lo que buscas? Contáctanos para soluciones a la
            medida.
          </p>
        </div>
      </div>
    </main>
  );
}
