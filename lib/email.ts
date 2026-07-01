import nodemailer from "nodemailer";
import { CartItem } from "@/app/store/useCartStore";

// ⚙️ Configuración adaptada para los servidores reales de Resend
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * 🔑 Envía el correo con la contraseña temporal de recuperación
 */
export async function enviarCorreoPasswordTemporal(
  correoDestino: string,
  passTemporal: string,
) {
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="font-family: sans-serif; background-color: #09090b; color: #ececec; padding: 20px; margin: 0;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);">
        <h2 style="color: #ffffff; margin-top: 0; font-size: 20px; font-weight: 600;">Recuperación de Contraseña 🔑</h2>
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.5;">Hemos recibido una solicitud para restablecer tu contraseña en el Catálogo de Soluciones de Infraestructura.</p>

        <div style="background-color: #09090b; border: 1px solid #27272a; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <p style="color: #71717a; font-size: 11px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em;">Contraseña Temporal de Acceso</p>
          <span style="font-family: monospace; font-size: 26px; font-weight: bold; color: #10b981; letter-spacing: 2px;">${passTemporal}</span>
        </div>

        <p style="color: #f43f5e; font-size: 13px; font-weight: 500; line-height: 1.4;">
          ⚠️ Nota de seguridad: Esta contraseña es de un único uso temporal. Al iniciar sesión con ella, el sistema detectará la bandera y te exigirá cambiarla por una clave personal definitiva.
        </p>

        <hr style="border: 0; border-top: 1px solid #27272a; margin: 24px 0;" />
        <p style="color: #71717a; font-size: 11px; text-align: center; margin: 0;">Catálogo de Soluciones de Infraestructura © 2026</p>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Seguridad Catálogo" <onboarding@resend.dev>`,
    to: correoDestino,
    subject: "Tu contraseña temporal de acceso 🔑",
    html: htmlTemplate,
  });
}

/**
 * 🎉 Envía el correo detallado de confirmación de orden (Productos y Servicios)
 */
export async function enviarCorreoConfirmacionOrden(
  correoDestino: string,
  ordenId: number,
  total: number,
  items: CartItem[],
) {
  // 1. Tu lógica exacta para generar las filas dinámicas de servicios y productos físicos
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

  // 2. Tu estructura HTML exacta en modo oscuro
  const htmlTemplate = `
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

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
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

  // 3. Envío directo usando Resend
  await transporter.sendMail({
    from: `"Tienda Soporte" <onboarding@resend.dev>`,
    to: correoDestino,
    subject: `Confirmación de tu Orden #${ordenId} 🎉`,
    html: htmlTemplate,
  });
}
