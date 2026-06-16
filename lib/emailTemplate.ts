import { CartItem } from "@/app/store/useCartStore";

interface GenerarEmailProps {
  ordenId: number;
  total: number;
  items: CartItem[];
}

export function generarHtmlEmail({
  ordenId,
  total,
  items,
}: GenerarEmailProps): string {
  // Generamos dinámicamente las filas de la tabla según los ítems comprados
  const filasItemsHtml = items
    .map((item) => {
      const esServicio = item.tipo === "Servicio";
      const detalleTipo = esServicio
        ? `<span style="color: #60a5fa; font-size: 11px; display: block; margin-top: 4px;">📅 Renta: ${item.fechaInicio} al ${item.fechaFin}</span>`
        : `<span style="color: #a1a1aa; font-size: 11px; display: block; margin-top: 4px;">📦 Producto Físico</span>`;

      const cantidad = esServicio ? 1 : item.cantidadSeleccionada || 1;
      const subtotalItem = item.precio * cantidad;

      return `
      <tr style="border-bottom: 1px solid #27272a;">
        <td style="padding: 12px 0; font-size: 14px; color: #f4f4f5;">
          <strong>${item.nombre}</strong>
          ${detalleTipo}
        </td>
        <td style="padding: 12px 0; text-align: center; font-size: 14px; color: #e4e4e7;">
          ${cantidad}
        </td>
        <td style="padding: 12px 0; text-align: right; font-size: 14px; color: #f4f4f5; font-weight: bold;">
          Q${subtotalItem.toFixed(2)}
        </td>
      </tr>
    `;
    })
    .join("");

  // Estructura principal del correo con CSS inline (obligatorio para clientes de correo)
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Confirmación de Orden #${ordenId}</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #09090b; color: #ececec; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 32px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);">

        <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid #27272a; padding-bottom: 20px;">
          <h2 style="color: #ffffff; margin: 0; font-size: 24px; tracking-tight: -0.025em;">¡Orden Confirmada! 🚀</h2>
          <p style="color: #a1a1aa; font-size: 14px; margin-top: 8px;">Gracias por tu confianza. Tu solicitud ya está siendo procesada.</p>
        </div>

        <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 14px;">
          <div style="margin-bottom: 6px;"><span style="color: #a1a1aa;">Número de Orden:</span> <strong style="color: #3b82f6;">#${ordenId}</strong></div>
          <div><span style="color: #a1a1aa;">Fecha de Emisión:</span> <strong style="color: #e4e4e7;">${new Date().toLocaleDateString("es-GT")}</strong></div>
        </div>

        <table style="w-full; border-collapse: collapse; width: 100%; margin-bottom: 24px;">
          <thead>
            <tr style="border-bottom: 2px solid #27272a; text-align: left;">
              <th style="padding-bottom: 8px; font-size: 12px; text-transform: uppercase; color: #a1a1aa;">Solución</th>
              <th style="padding-bottom: 8px; text-align: center; font-size: 12px; text-transform: uppercase; color: #a1a1aa;">Cant.</th>
              <th style="padding-bottom: 8px; text-align: right; font-size: 12px; text-transform: uppercase; color: #a1a1aa;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${filasItemsHtml}
          </tbody>
        </table>

        <div style="border-top: 2px solid #27272a; padding-top: 16px; text-align: right; margin-bottom: 32px;">
          <span style="font-size: 14px; color: #a1a1aa; margin-right: 12px;">Total de la Orden (con IVA):</span>
          <span style="font-size: 20px; font-weight: bold; color: #22c55e;">Q${Number(total).toFixed(2)}</span>
        </div>

        <div style="text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #27272a; padding-top: 16px;">
          <p style="margin: 0;">Este es un correo automático, por favor no respondas a este mensaje.</p>
          <p style="margin: 4px 0 0 0;">Catálogo de Soluciones de Infraestructura © 2026</p>
        </div>

      </div>
    </body>
    </html>
  `;
}
