"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function RecuperarPage() {
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMensaje("");
    setLoading(true);

    try {
      const response = await fetch("/api/usuarios/auth/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Hubo un problema al procesar la solicitud",
        );
      }

      setMensaje(data.mensaje);
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
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-sm text-zinc-400">
            Introduce tu correo para recibir una contraseña temporal de acceso.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-400">
            {mensaje}
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
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              disabled={loading}
              className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus-visible:ring-emerald-500"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-zinc-950 font-medium hover:bg-emerald-500 transition-colors"
          >
            {loading ? "Enviando..." : "Enviar contraseña temporal"}
          </Button>
        </form>

        <p className="text-center text-xs text-zinc-400">
          <Link
            href="/login"
            className="text-emerald-400 hover:underline font-medium"
          >
            Volver al Login
          </Link>
        </p>
      </div>
    </main>
  );
}
