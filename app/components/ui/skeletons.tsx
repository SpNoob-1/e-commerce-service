function ProductSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-between shadow-lg shadow-black/20 h-[430px] animate-pulse">
      {/* 🎯 ENCABEZADO ESQUELETO */}
      <div className="flex items-center gap-3 mb-4">
        {/* Círculo del ID */}
        <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0" />
        {/* Título y Categoría */}
        <div className="w-full space-y-2">
          <div className="h-4 bg-zinc-800 rounded w-3/4" />
          <div className="h-3 bg-zinc-800 rounded w-1/2" />
        </div>
      </div>

      {/* 🖼️ CONTENEDOR DE LA IMAGEN ESQUELETO */}
      <div className="w-full h-48 rounded-xl bg-zinc-950 mb-4" />

      {/* 📄 CUERPO TEXTUAL ESQUELETO */}
      <div className="flex-grow mb-6 space-y-2">
        <div className="h-3 bg-zinc-800 rounded w-full" />
        <div className="h-3 bg-zinc-800 rounded w-full" />
        <div className="h-3 bg-zinc-800 rounded w-2/3" />
      </div>

      {/* 💸 ACCIONES Y PRECIO ESQUELETO */}
      <div className="mt-auto pt-4 border-t border-zinc-800/60 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        <div className="space-y-2 w-20">
          <div className="h-2 bg-zinc-800 rounded w-full" />
          <div className="h-5 bg-zinc-800 rounded w-full" />
        </div>
        <div className="h-10 bg-zinc-800 rounded-xl w-full xl:w-28" />
      </div>
    </div>
  );
}
// Este componente dibuja una cuadrícula con 8 esqueletos para simular el catálogo completo
function CatalogSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
      {Array.from({ length: 8 }).map((_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </div>
  );
}

export { CatalogSkeleton, ProductSkeleton };
