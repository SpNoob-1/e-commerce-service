"use client";
import CatalogList from "../components/ui/CatalogList";
import CartButton from "../components/ui/CartButton";

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
        </div>

        {/* 📦 EL CATÁLOGO REAL (Controlado por useQuery e isLoading) */}
        <div className="fixed bottom-6 right-6 z-50">
          <CartButton />
        </div>
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
