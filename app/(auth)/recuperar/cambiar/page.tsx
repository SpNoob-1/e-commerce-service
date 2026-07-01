"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CambiarPasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    correo: "",
    passwordTemporal: "",
    nuevoPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/usuarios/auth/cambiar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Hubo un error al actualizar la contraseña",
        );
      }

      alert(
        "¡Contraseña actualizada con éxito! Inicia sesión con tus nuevas credenciales.",
      );
      router.push("/login"); // Redirige al login para probar su nueva clave
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
            Actualizar Contraseña
          </h1>
          <p className="text-sm text-zinc-400">
            Por seguridad, debes configurar una contraseña definitiva para tu
            cuenta
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
            <label className="text-sm font-medium text-zinc-300">
              Contraseña Temporal
            </label>
            <Input
              type="password"
              required
              placeholder="Pega la clave de Mailtrap"
              value={formData.passwordTemporal}
              onChange={(e) =>
                setFormData({ ...formData, passwordTemporal: e.target.value })
              }
              className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus-visible:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-300">
              Nueva Contraseña Definitiva
            </label>
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={formData.nuevoPassword}
              onChange={(e) =>
                setFormData({ ...formData, nuevoPassword: e.target.value })
              }
              className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus-visible:ring-emerald-500"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-zinc-950 font-medium hover:bg-emerald-500 transition-colors"
          >
            {loading ? "Actualizando..." : "Confirmar Nueva Contraseña"}
          </Button>
        </form>
      </div>
    </main>
  );
}
