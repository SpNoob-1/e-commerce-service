"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Hubo un error al registrarse");
      }

      alert("¡Usuario registrado con éxito! Ahora puedes iniciar sesión.");
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-50">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-zinc-900 p-8 border border-zinc-800/80 shadow-2xl">
        {/* Encabezado */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Crear una cuenta
          </h1>
          <p className="text-sm text-zinc-400">
            Regístrate para gestionar tus compras y servicios
          </p>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Formulario usando componentes de Shadcn */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-300">
              Nombre Completo
            </label>
            <Input
              type="text"
              name="nombre"
              required
              placeholder="Juan Pérez"
              value={formData.nombre}
              onChange={handleChange}
              className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus-visible:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-300">
              Correo Electrónico
            </label>
            <Input
              type="email"
              name="correo"
              required
              placeholder="nombre@ejemplo.com"
              value={formData.correo}
              onChange={handleChange}
              className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus-visible:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-300">
              Contraseña
            </label>
            <Input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus-visible:ring-emerald-500"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-zinc-950 font-medium hover:bg-emerald-500 transition-colors"
          >
            {loading ? "Registrando..." : "Registrarse"}
          </Button>
        </form>

        {/* Link para alternar al Login */}
        <p className="text-center text-xs text-zinc-400">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="text-emerald-400 hover:underline font-medium"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </main>
  );
}
