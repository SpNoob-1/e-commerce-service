"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ModalPagoTarjetaProps {
  isOpen: boolean;
  onClose: () => void;
  onPagoExitoso: (datosFormulario: {
    envioNombre: string;
    envioCorreo: string;
    envioTelefono: string;
    envioDireccion: string;
    tarjeta: any;
  }) => void;
  total: number;
  usuarioInicial: any; // 👤 Recibido desde la sesión del CartPage
}

export default function ModalPagoTarjeta({
  isOpen,
  onClose,
  onPagoExitoso,
  total,
  usuarioInicial,
}: ModalPagoTarjetaProps) {
  // 1. Paso del flujo interno: "envio" o "tarjeta"
  const [paso, setPaso] = useState<"envio" | "tarjeta">("envio");

  // 2. Estado de datos de contacto y envío
  const [contacto, setContacto] = useState({
    envioNombre: "",
    envioCorreo: "",
    envioTelefono: "",
    envioDireccion: "",
  });

  // 3. Estado de la tarjeta bancaria
  const [tarjeta, setTarjeta] = useState({
    numero: "",
    nombre: "",
    expiracion: "",
    cvv: "",
  });

  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);

  // 🔄 Auto-llenar campos si hay una sesión activa al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setPaso("envio"); // Reseteamos al primer paso siempre
      setError("");
      if (usuarioInicial) {
        setContacto({
          envioNombre: usuarioInicial.nombre || "",
          envioCorreo: usuarioInicial.correo || usuarioInicial.email || "",
          envioTelefono: usuarioInicial.telefono || "",
          envioDireccion: usuarioInicial.direccion || "",
        });
      } else {
        // Si entra como invitado limpiamos los inputs
        setContacto({
          envioNombre: "",
          envioCorreo: "",
          envioTelefono: "",
          envioDireccion: "",
        });
      }
    }
  }, [isOpen, usuarioInicial]);

  // Formateadores automáticos estéticos para la tarjeta
  const handleNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, "").substring(0, 16);
    const formateado = valor.match(/.{1,4}/g)?.join(" ") || valor;
    setTarjeta({ ...tarjeta, numero: formateado });
  };

  const handleExpiracionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, "").substring(0, 4);
    if (valor.length > 2) {
      valor = `${valor.substring(0, 2)}/${valor.substring(2)}`;
    }
    setTarjeta({ ...tarjeta, expiracion: valor });
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, "").substring(0, 3);
    setTarjeta({ ...tarjeta, cvv: valor });
  };

  // Manejo del envío del formulario completo
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (paso === "envio") {
      // Validaciones del paso 1
      if (
        !contacto.envioNombre ||
        !contacto.envioCorreo ||
        !contacto.envioTelefono
      ) {
        setError("❌ Nombre, Correo y Teléfono son campos requeridos.");
        return;
      }
      // Si todo está correcto, avanzamos al paso de la tarjeta
      setPaso("tarjeta");
      return;
    }

    // Validaciones del paso 2 (Tarjeta)
    if (tarjeta.numero.replace(/\s/g, "").length !== 16) {
      setError("❌ El número de tarjeta debe tener 16 dígitos.");
      return;
    }
    if (tarjeta.expiracion.length !== 5) {
      setError("❌ Fecha de expiración inválida (MM/AA).");
      return;
    }
    if (tarjeta.cvv.length !== 3) {
      setError("❌ El CVV debe tener 3 dígitos.");
      return;
    }

    setProcesando(true);

    // Simulamos la latencia de respuesta bancaria y enviamos todo junto
    setTimeout(() => {
      setProcesando(false);
      onPagoExitoso({
        ...contacto,
        tarjeta,
      });
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={procesando ? undefined : onClose}>
      <DialogContent className="sm:max-w-[440px] bg-zinc-900 border-zinc-800 text-zinc-50 max-w-[95vw] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
            {paso === "envio"
              ? "📋 Información de Entrega"
              : "💳 Procesar Pago Seguro"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">
            {paso === "envio"
              ? "Confirma tus datos de contacto y entrega. Soporta compras tanto de usuarios como de invitados."
              : "Introduce los datos de tu tarjeta de crédito o débito para completar la adquisición."}
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de pasos visual */}
        <div className="flex gap-2 my-1">
          <div
            className={`h-1 flex-1 rounded-full ${paso === "envio" ? "bg-emerald-500" : "bg-zinc-700"}`}
          />
          <div
            className={`h-1 flex-1 rounded-full ${paso === "tarjeta" ? "bg-emerald-500" : "bg-zinc-700"}`}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
              {error}
            </div>
          )}

          {paso === "envio" ? (
            /* ================= SECCIÓN DE ENVÍO Y CONTACTO ================= */
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-medium">
                  Nombre Completo
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={contacto.envioNombre}
                  onChange={(e) =>
                    setContacto({ ...contacto, envioNombre: e.target.value })
                  }
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-500 text-sm placeholder:text-zinc-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-medium font-sans">
                  Correo Electrónico
                </label>
                <Input
                  type="email"
                  required
                  placeholder="juan@correo.com"
                  value={contacto.envioCorreo}
                  onChange={(e) =>
                    setContacto({ ...contacto, envioCorreo: e.target.value })
                  }
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-500 text-sm placeholder:text-zinc-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-medium">
                  Teléfono de Contacto
                </label>
                <Input
                  type="tel"
                  required
                  placeholder="55554444"
                  value={contacto.envioTelefono}
                  onChange={(e) =>
                    setContacto({ ...contacto, envioTelefono: e.target.value })
                  }
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-500 text-sm placeholder:text-zinc-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-medium">
                  Dirección de Envío{" "}
                  <span className="text-zinc-600 font-normal">
                    (Opcional para servicios)
                  </span>
                </label>
                <Input
                  type="text"
                  placeholder="Ciudad de Guatemala, Zona 10..."
                  value={contacto.envioDireccion}
                  onChange={(e) =>
                    setContacto({ ...contacto, envioDireccion: e.target.value })
                  }
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-500 text-sm placeholder:text-zinc-700"
                />
              </div>
            </div>
          ) : (
            /* ================= SECCIÓN DE LA TARJETA ================= */
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-medium">
                  Nombre en la Tarjeta
                </label>
                <Input
                  type="text"
                  required
                  placeholder="JUAN PEREZ"
                  disabled={procesando}
                  value={tarjeta.nombre}
                  onChange={(e) =>
                    setTarjeta({
                      ...tarjeta,
                      nombre: e.target.value.toUpperCase(),
                    })
                  }
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-500 text-sm placeholder:text-zinc-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-medium">
                  Número de Tarjeta
                </label>
                <Input
                  type="text"
                  required
                  placeholder="0000 0000 0000 0000"
                  disabled={procesando}
                  value={tarjeta.numero}
                  onChange={handleNumeroChange}
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-500 font-mono text-sm placeholder:text-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-medium">
                    Expiración
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="MM/AA"
                    disabled={procesando}
                    value={tarjeta.expiracion}
                    onChange={handleExpiracionChange}
                    className="bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-500 text-center font-mono text-sm placeholder:text-zinc-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-medium">
                    CVV
                  </label>
                  <Input
                    type="password"
                    required
                    placeholder="***"
                    disabled={procesando}
                    value={tarjeta.cvv}
                    onChange={handleCvvChange}
                    className="bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-500 text-center font-mono text-sm placeholder:text-zinc-700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Detalles del Monto y Botones Dinámicos */}
          <div className="pt-4 border-t border-zinc-800 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400">Total a deducir:</span>
              <span className="font-bold text-lg text-emerald-400">
                Q{total.toFixed(2)}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              {paso === "envio" ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold"
                  >
                    Continuar al Pago →
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={procesando}
                    onClick={() => {
                      setError("");
                      setPaso("envio");
                    }}
                    className="flex-1 bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                  >
                    ← Volver
                  </Button>
                  <Button
                    type="submit"
                    disabled={procesando}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold shadow-md transition-colors"
                  >
                    {procesando ? (
                      <span className="flex items-center justify-center gap-1.5 animate-pulse">
                        ⏳ Verificando...
                      </span>
                    ) : (
                      "Pagar Orden 🚀"
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
