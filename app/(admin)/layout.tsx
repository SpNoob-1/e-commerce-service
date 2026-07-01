"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    const sesion = localStorage.getItem("usuario_sesion");

    if (!sesion) {
      console.log(
        "🚨 Seguridad Admin: No existe objeto de sesión en localStorage.",
      );
      router.push("/login");
      return;
    }

    const userObj = JSON.parse(sesion);

    // 🔬 INVESTIGACIÓN EN VIVO: Abre la consola del navegador (F12) para ver esto
    console.log("👤 Objeto de usuario detectado en sesión:", userObj);
    console.log("🔑 Tu rolId actual en el navegador es:", userObj.rolId);

    // 🛡️ PLAN DE RESPALDO: Permitimos pasar si el rolId es 1, o si su correo es el tuyo
    if (
      Number(userObj.rolId) === 1 ||
      userObj.correo === "skylumina09@gmail.com"
    ) {
      console.log("✅ Acceso Concedido como Administrador.");
      setAutorizado(true);
    } else {
      console.log("❌ Acceso Denegado. Redireccionando a la tienda...");
      router.push("/");
    }
  }, [router]);

  if (!autorizado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400 text-sm">
        Verificando credenciales de administrador...
      </div>
    );
  }

  const enlacesNav = [
    { nombre: "Dashboard", href: "/admin/dashboard", icono: "📊" },
    { nombre: "Productos y Stock", href: "/admin/productos", icono: "📦" },
    { nombre: "Órdenes Globales", href: "/admin/ordenes", icono: "📜" },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50 font-sans">
      {/* 💻 SIDEBAR LATERAL (Fijo en Escritorio, oculto en móviles) */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-900 border-r border-zinc-800 p-6 space-y-6 shrink-0">
        <div className="flex items-center gap-2 px-2">
          <span className="text-xl">🛠️</span>
          <span className="font-bold tracking-tight text-lg text-emerald-400">
            AdminPanel
          </span>
        </div>

        <nav className="flex-1 space-y-1">
          {enlacesNav.map((link) => {
            const activo = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activo
                    ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
              >
                <span>{link.icono}</span>
                {link.nombre}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-800 pt-4">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <span>🏠</span> Volver a la Tienda
          </Link>
        </div>
      </aside>

      {/* 📱 CONTENEDOR PRINCIPAL + TOPBAR MÓVIL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar responsivo */}
        <header className="md:hidden flex items-center justify-between h-14 bg-zinc-900 border-b border-zinc-800 px-4">
          <span className="font-bold text-emerald-400 text-sm">
            🛠️ AdminPanel
          </span>
          {/* Menú rápido horizontal para móviles */}
          <nav className="flex gap-4 text-xs">
            {enlacesNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  pathname === link.href
                    ? "text-emerald-400 font-semibold"
                    : "text-zinc-400"
                }
              >
                {link.nombre.split(" ")[0]}
              </Link>
            ))}
          </nav>
        </header>

        {/* 📋 CONTENIDO DINÁMICO DE LAS PÁGINAS */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
