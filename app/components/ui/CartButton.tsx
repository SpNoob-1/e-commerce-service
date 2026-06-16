"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCartStore } from "@/app/store/useCartStore";

export default function CartButton() {
  const items = useCartStore((state) => state.items);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  // Calculamos el número total de artículos en el carrito
  const totalArticulos = items.reduce((total, item) => {
    return total + (item.cantidadSeleccionada || 1);
  }, 0);

  const tieneItems = totalArticulos > 0;

  return (
    <Link href="/carrito" className="relative inline-block">
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
          tieneItems
            ? "bg-green-600 hover:bg-green-500 text-white animate-pulse-subtle"
            : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800"
        }`}
      >
        <HugeiconsIcon icon={ShoppingCart} size={25} />
        {tieneItems && (
          <span className="absolute -top-1 -right-1 bg-white text-black font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg border border-red-600 animate-in scale-in">
            {totalArticulos}
          </span>
        )}
      </div>
    </Link>
  );
}
