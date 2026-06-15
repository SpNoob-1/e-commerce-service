"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ correo: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      // Requerimiento de seguridad: Si la contraseña es temporal, lo mandamos a cambiarla
      if (data.usuario.esPassTemporal) {
        alert("Tu contraseña es temporal. Debes cambiarla ahora.");
        router.push("/recuperar/cambiar");
        return;
      }

      alert(`¡Bienvenido de nuevo, ${data.usuario.nombre}!`);
      router.push("/"); // Te redirige al catálogo principal (Sprint 2)
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-50">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-zinc-900 p-8 border border-zinc-800/80 shadow-2xl">
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Iniciar Sesión
          </h1>
          <p className="text-sm text-zinc-400">
            Ingresa tus credenciales para acceder a tu cuenta
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-300">
              Correo Electrónico
            </label>
            <Input
              type="email"
              required
              placeholder="nombre@ejemplo.com"
              value={formData.correo}
              onChange={(e) =>
                setFormData({ ...formData, correo: e.target.value })
              }
              className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus-visible:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">
                Contraseña
              </label>
              <Link
                href="/recuperar"
                className="text-xs text-emerald-400 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus-visible:ring-emerald-500"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-zinc-950 font-medium hover:bg-emerald-500 transition-colors"
          >
            {loading ? "Cargando..." : "Continuar"}
          </Button>
        </form>

        <p className="text-center text-xs text-zinc-400">
          ¿No tienes una cuenta?{" "}
          <Link
            href="/register"
            className="text-emerald-400 hover:underline font-medium"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}
