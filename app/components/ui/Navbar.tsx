"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const [usuario, setUsuario] = useState<{
    nombre: string;
    correo: string;
  } | null>(null);
  const router = useRouter();
  const pathname = usePathname(); // 👈 Monitorea la ruta actual para forzar la lectura de sesión

  const cargarSesion = () => {
    const sesionGuardada = localStorage.getItem("usuario_sesion");
    if (sesionGuardada) {
      setUsuario(JSON.parse(sesionGuardada));
    } else {
      setUsuario(null);
    }
  };

  useEffect(() => {
    // Carga la sesión al montar el componente y cada vez que cambies de página
    cargarSesion();

    // Escucha si la sesión cambia desde otra pestaña o pantalla (como el login)
    window.addEventListener("storage", cargarSesion);
    window.addEventListener("sesion_iniciada", cargarSesion);

    return () => {
      window.removeEventListener("storage", cargarSesion);
      window.removeEventListener("sesion_iniciada", cargarSesion);
    };
  }, [pathname]); // 👈 Cada vez que cambie la URL, se verifica el estado actual

  const handleCerrarSesion = () => {
    localStorage.removeItem("usuario_sesion");
    setUsuario(null);
    router.push("/login");
  };

  return (
    <nav className="flex items-center justify-between bg-zinc-900 border-b border-zinc-800 px-6 py-4 text-zinc-100">
      <Link
        href="/"
        className="text-xl font-bold tracking-tight text-emerald-400"
      >
        🛠️ Infraestructura Catálogo
      </Link>

      <div className="flex items-center gap-4">
        {usuario ? (
          <>
            {/* 👤 Cambia dinámicamente al botón de Perfil requerido en el Sprint 4 */}
            <Link
              href="/perfil"
              className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium hover:bg-zinc-700 transition-colors border border-zinc-700 text-zinc-100"
            >
              Mi Perfil ({usuario.nombre})
            </Link>
            <button
              onClick={handleCerrarSesion}
              className="text-sm text-zinc-400 hover:text-red-400 transition-colors"
            >
              cerrar sesión
            </button>
          </>
        ) : (
          /* 🔑 Botón por defecto */
          <Link
            href="/login"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-500 transition-colors"
          >
            Iniciar Sesión
          </Link>
        )}
      </div>
    </nav>
  );
}
