"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface DetalleOrden {
  id: number;
  cantidad: number;
  precioUnit: number;
  fechaInicio: string | null;
  fechaFin: string | null;
  estadoDetalle: string; // 🟢 Cambiado para coincidir exactamente con el backend
  producto: {
    nombre: string;
    esServicio: boolean; // 🟢 Sincronizado con el booleano del mapeo
  };
}

interface Orden {
  id: number;
  total: number;
  fecha: string;
  estado: string; // Estado macro general
  detalles: DetalleOrden[];
}

export default function PerfilPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para el formulario de cambio de clave interna
  const [passwordState, setPasswordState] = useState({ actual: "", nueva: "" });
  const [mensajeClave, setMensajeClave] = useState({ texto: "", tipo: "" });

  // 1. Efecto inicial: Control de sesión local
  useEffect(() => {
    const sesion = localStorage.getItem("usuario_sesion");
    if (!sesion) {
      router.push("/login");
      return;
    }
    setUsuario(JSON.parse(sesion));
  }, [router]);

  // 2. ⏱️ Polling de alta fidelidad para sincronizar estados con el Admin sin recargar la página
  useEffect(() => {
    if (!usuario?.id) return;

    const cargarOrdenes = () => {
      fetch(`/api/usuarios/ordenes?usuarioId=${usuario.id}`)
        .then((res) => res.json())
        .then((data) => {
          // 🚨 Corrección de Contrato: Si viene directo el array o dentro de un objeto
          const listaOrdenes = Array.isArray(data) ? data : data.ordenes || [];
          setOrdenes(listaOrdenes);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error al sincronizar historial:", err);
          setLoading(false);
        });
    };

    // Ejecución inmediata al cargar la sesión
    cargarOrdenes();

    // Re-consulta la base de datos automáticamente cada 4 segundos
    const intervalo = setInterval(cargarOrdenes, 4000);

    return () => clearInterval(intervalo);
  }, [usuario?.id]);

  const handleCambiarClave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeClave({ texto: "", tipo: "" });

    try {
      const res = await fetch("/api/usuarios/auth/cambiar-interna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: usuario.correo,
          passwordActual: passwordState.actual,
          nuevoPassword: passwordState.nueva,
        }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setMensajeClave({
          texto: `❌ Error del servidor (${res.status}): La ruta de la API podría estar mal escrita o caída.`,
          tipo: "error",
        });
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setMensajeClave({ texto: data.error || "Error", tipo: "error" });
      } else {
        setMensajeClave({
          texto: "¡Contraseña actualizada correctamente!",
          tipo: "success",
        });
        setPasswordState({ actual: "", nueva: "" });
      }
    } catch (err: any) {
      setMensajeClave({
        texto: "Hubo un fallo de red al intentar conectar con el servidor.",
        tipo: "error",
      });
    }
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400 font-mono text-xs">
        Cargando perfil y sincronizando pedidos...
      </div>
    );

  // 🌟 Mapeo Granular Correcto basado en el nuevo contrato del endpoint
  const todosLosDetalles =
    ordenes?.flatMap((o) =>
      o.detalles.map((d) => ({
        ...d,
        estadoReal: d.estadoDetalle || "Pendiente", // 👈 Ahora lee estadoDetalle de forma correcta
        ordenId: o.id,
        esServicio: d.producto?.esServicio || false,
      })),
    ) || [];

  // Separación limpia por tipo usando el nuevo booleano inyectado
  const productosFisicos = todosLosDetalles.filter((d) => !d.esServicio);
  const serviciosRenta = todosLosDetalles.filter((d) => d.esServicio);

  const getBadgeStyles = (estado: string) => {
    const est = estado.toLowerCase();
    if (est === "pendiente")
      return "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse";
    if (est === "cancelado")
      return "bg-red-500/10 text-red-400 border-red-500/20";
    if (est === "entregado" || est === "completado" || est === "activo")
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Encabezado del Perfil */}
        <div className="border-b border-zinc-800 pb-6 space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-mono">
              Mi Perfil
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Gestiona tus credenciales e historial de soluciones tecnológicas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-6 text-sm text-zinc-300 bg-zinc-900 p-4 rounded-xl border border-zinc-800/80">
            <div className="break-all">
              <span className="text-zinc-500 block sm:inline">Nombre:</span>{" "}
              {usuario?.nombre}
            </div>
            <div className="break-all">
              <span className="text-zinc-500 block sm:inline">Correo:</span>{" "}
              {usuario?.correo}
            </div>
            <div>
              <span className="text-zinc-500 block sm:inline">Rol:</span>{" "}
              <span className="text-emerald-400 font-medium">
                {usuario?.rol || "Cliente"}
              </span>
            </div>
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold text-zinc-200 tracking-tight flex items-center gap-2 font-mono">
              <span>📦</span> Mis Compras e Historial
            </h2>

            {/* SECCIÓN 1: PRODUCTOS FÍSICOS */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 shadow-md">
              <h3 className="text-sm font-medium text-zinc-400 border-b border-zinc-800 pb-2 mb-4 font-mono">
                Equipos y Materiales Adquiridos
              </h3>
              {productosFisicos.length === 0 ? (
                <p className="text-sm text-zinc-500 italic">
                  No has comprado productos físicos aún.
                </p>
              ) : (
                <div className="space-y-3">
                  {productosFisicos.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-sm p-4 bg-zinc-950 rounded-lg border border-zinc-800/60"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-zinc-500 block">
                          ORDEN #{item.ordenId}
                        </span>
                        <span className="font-semibold text-zinc-200 block">
                          {item.producto?.nombre}
                        </span>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <div className="inline-flex items-center gap-2 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-zinc-400">
                            <span className="text-zinc-500">Cantidad:</span>
                            <span className="font-medium text-zinc-300">
                              {item.cantidad}
                            </span>
                          </div>
                          {item.fechaFin && (
                            <div className="inline-flex items-center gap-1.5 text-zinc-500 font-mono">
                              <span>
                                📅 Entrega estimada:{" "}
                                {new Date(item.fechaFin).toLocaleDateString(
                                  "es-GT",
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <span
                          className={`text-[11px] px-2.5 py-0.5 rounded border font-medium uppercase tracking-wider font-mono ${getBadgeStyles(item.estadoReal)}`}
                        >
                          {item.estadoReal === "Enviado" && "🚚 "}
                          {item.estadoReal === "Entregado" && "✅ "}
                          {item.estadoReal}
                        </span>
                        <span className="font-medium text-emerald-400 text-base font-mono">
                          Q{(item.precioUnit * item.cantidad).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECCIÓN 2: SERVICIOS Y RENTAS */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 shadow-md">
              <h3 className="text-sm font-medium text-zinc-400 border-b border-zinc-800 pb-2 mb-4 font-mono">
                Servicios e Infraestructura en Renta
              </h3>
              {serviciosRenta.length === 0 ? (
                <p className="text-sm text-zinc-500 italic">
                  No registras contratos de servicio activos.
                </p>
              ) : (
                <div className="space-y-3">
                  {serviciosRenta.map((item) => {
                    const fechaI = item.fechaInicio
                      ? new Date(item.fechaInicio)
                      : null;
                    const fechaF = item.fechaFin
                      ? new Date(item.fechaFin)
                      : null;

                    return (
                      <div
                        key={item.id}
                        className="p-4 bg-zinc-950 rounded-lg border border-zinc-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-4 space-y-3 sm:space-y-0"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-zinc-500 block">
                            ORDEN #{item.ordenId}
                          </span>
                          <span className="font-semibold text-zinc-200 block text-sm">
                            {item.producto?.nombre}
                          </span>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                            {fechaI && fechaF ? (
                              <span className="font-mono">
                                📅 Período: {fechaI.toLocaleDateString("es-GT")}{" "}
                                al {fechaF.toLocaleDateString("es-GT")}
                              </span>
                            ) : (
                              <span>Vigencia contractual interna</span>
                            )}
                            <span className="text-zinc-700">|</span>
                            <span>Cant: {item.cantidad}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 justify-between sm:justify-end w-full sm:w-auto">
                          <span
                            className={`text-[11px] px-2.5 py-0.5 rounded border font-medium uppercase tracking-wider font-mono ${getBadgeStyles(item.estadoReal)}`}
                          >
                            {(item.estadoReal === "Activo" ||
                              item.estadoReal === "Vigente") &&
                              "⚡ "}
                            {item.estadoReal === "Completado" && "✅ "}
                            {item.estadoReal}
                          </span>
                          <span className="font-medium text-emerald-400 text-base font-mono">
                            Q{(item.precioUnit * item.cantidad).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* CAMBIO DE CONTRASEÑA */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 shadow-md space-y-4">
            <div className="border-b border-zinc-800 pb-2">
              <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2 font-mono">
                <span>🔒</span> Seguridad de la Cuenta
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Actualiza tu contraseña de acceso directamente desde aquí.
              </p>
            </div>

            {mensajeClave.texto && (
              <div
                className={`p-3 rounded-lg text-xs border ${
                  mensajeClave.tipo === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
              >
                {mensajeClave.texto}
              </div>
            )}

            <form
              onSubmit={handleCambiarClave}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end"
            >
              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-medium">
                  Contraseña Actual
                </label>
                <Input
                  type="password"
                  required
                  value={passwordState.actual}
                  onChange={(e) =>
                    setPasswordState({
                      ...passwordState,
                      actual: e.target.value,
                    })
                  }
                  className="bg-zinc-950 border-zinc-800 text-sm focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-medium">
                  Nueva Contraseña
                </label>
                <Input
                  type="password"
                  required
                  value={passwordState.nueva}
                  onChange={(e) =>
                    setPasswordState({
                      ...passwordState,
                      nueva: e.target.value,
                    })
                  }
                  className="bg-zinc-950 border-zinc-800 text-sm focus-visible:ring-emerald-500"
                />
              </div>
              <div className="sm:col-span-2 pt-2">
                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold px-6"
                >
                  Actualizar Credenciales
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="pt-4 border-t border-t-zinc-900">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors gap-1.5"
          >
            ← Volver al catálogo principal
          </Link>
        </div>
      </div>
    </main>
  );
}
