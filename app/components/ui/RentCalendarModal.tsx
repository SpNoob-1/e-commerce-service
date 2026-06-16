"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface RentCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (fechaInicio: string, fechaFin: string) => void;
  productoNombre: string;
  precioMensual: number;
}

export default function RentCalendarModal({
  isOpen,
  onClose,
  onConfirm,
  productoNombre,
  precioMensual,
}: RentCalendarModalProps) {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!fechaInicio || !fechaFin) return;

    // 🛡️ Validación de seguridad de último minuto antes de confirmar por si burlaron el input
    if (
      fechaInicio > maxFechaStr ||
      fechaFin > maxFechaStr ||
      fechaInicio < hoyStr
    ) {
      alert(
        "Por favor, selecciona un rango de fechas válido dentro de los próximos 2 años.",
      );
      return;
    }

    onConfirm(fechaInicio, fechaFin);
    onClose();
  };

  const hoyStr = new Date().toISOString().split("T")[0];

  const maxFecha = new Date();
  maxFecha.setFullYear(maxFecha.getFullYear() + 2);
  const maxFechaStr = maxFecha.toISOString().split("T")[0];

  // ⚡ Función inteligente para manejar el cambio de fecha de inicio
  const handleFechaInicioChange = (val: string) => {
    setFechaInicio(val);
    // Si la fecha de fin actual es menor que la nueva fecha de inicio, la reiniciamos
    if (fechaFin && val > fechaFin) {
      setFechaFin("");
    }
  };

  // ⚡ Función para bloquear el exceso de dígitos en el año si digitan con teclado
  const filtrarEntradaTeclado = (
    val: string,
    setFecha: (v: string) => void,
  ) => {
    const partes = val.split("-"); // El formato nativo es YYYY-MM-DD
    if (partes[0] && partes[0].length > 4) {
      // Si el año supera los 4 dígitos, recortamos el año a un límite sensato
      partes[0] = partes[0].slice(0, 4);
      setFecha(partes.join("-"));
    } else {
      setFecha(val);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-5 text-zinc-100">
        {/* Encabezado */}
        <div>
          <h3 className="text-lg font-bold text-zinc-50 tracking-tight">
            Configurar Renta Mensual
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Selecciona las fechas de cobertura para:{" "}
            <span className="text-blue-400 font-medium">{productoNombre}</span>
          </p>
        </div>

        {/* Inputs de Fechas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              min={hoyStr}
              max={maxFechaStr}
              onChange={(e) =>
                filtrarEntradaTeclado(e.target.value, handleFechaInicioChange)
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 scheme-dark"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
              Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              min={fechaInicio || hoyStr}
              max={maxFechaStr}
              onChange={(e) =>
                filtrarEntradaTeclado(e.target.value, setFechaFin)
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 scheme-dark"
            />
          </div>
        </div>

        {/* Resumen del Costo */}
        <div className="bg-zinc-950 border border-zinc-800/60 rounded-xl p-3 text-xs flex justify-between items-center text-zinc-400">
          <span>Precio base del servicio:</span>
          <span className="font-bold text-zinc-200 text-sm">
            Q{precioMensual.toFixed(2)}/mes
          </span>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-3 pt-3">
          <Button
            type="button"
            onClick={onClose}
            className="w-full sm:w-1/2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 rounded-xl transition-colors border border-zinc-700/50 order-2 sm:order-1"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!fechaInicio || !fechaFin}
            onClick={handleConfirm}
            className="w-full sm:w-1/2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-2.5 rounded-xl transition-all disabled:cursor-not-allowed order-1 sm:order-2"
          >
            Añadir Reserva
          </Button>
        </div>
      </div>
    </div>
  );
}
