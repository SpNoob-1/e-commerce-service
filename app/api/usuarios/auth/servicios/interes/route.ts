import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { usuarioCorreo, usuarioNombre, productoNombre, disponibleDesde } =
      await req.json();

    if (!usuarioCorreo || !productoNombre || !usuarioNombre) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios para procesar la solicitud." },
        { status: 400 },
      );
    }

    // Configuración del transporte SMTP usando tus variables actuales
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST, // 👈 Cambiado de SMTP_HOST a EMAIL_HOST
      port: Number(process.env.EMAIL_PORT), // 👈 Cambiado de SMTP_PORT a EMAIL_PORT
      secure: true, // 👈 ¡OJO! Cambiado a true porque el puerto 465 exige SSL seguro
      auth: {
        user: process.env.EMAIL_USER, // 👈 Cambiado
        pass: process.env.EMAIL_PASS, // 👈 Cambiado
      },
    });

    const fechaFormateada = disponibleDesde
      ? new Date(disponibleDesde).toLocaleDateString("es-GT")
      : "Próximamente";

    // ⚡ DEFINIR EL CORREO DEL ADMINISTRADOR
    // Puedes poner tu correo real aquí o usar una variable de entorno como process.env.ADMIN_EMAIL
    const CORREO_ADMINISTRADOR = "skylumina090@gmail.com";

    // ⚡ HTML adaptado para que lo lea el Administrador (Modo Alerta de Lead)
    const htmlContent = `
      <div style="font-family: sans-serif; background-color: #09090b; color: #f4f4f5; padding: 24px; border-radius: 12px; border: 1px solid #27272a; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #fbbf24; border-bottom: 1px solid #27272a; padding-bottom: 12px; margin-top: 0;">⚠️ Nuevo Lead Interesado en Servicio</h2>
        <p>Hola Administrador,</p>
        <p>Un usuario ha manifestado interés en un servicio técnico de infraestructura que se encuentra <strong>actualmente ocupado u reservado</strong>:</p>

        <div style="background-color: #18181b; padding: 16px; border-radius: 8px; border: 1px solid #27272a; margin: 16px 0;">
          <p style="margin: 0; font-size: 15px;"><strong>Servicio Solicitado:</strong> ${productoNombre}</p>
          <p style="margin: 4px 0 0 0; color: #a1a1aa; font-size: 13px;">⏳ Ocupado actualmente hasta el: ${fechaFormateada}</p>
        </div>

        <h3 style="color: #10b981; font-size: 14px; margin-top: 20px;">Datos de Contacto del Cliente:</h3>
        <ul style="background-color: #18181b; padding: 12px 12px 12px 28px; border-radius: 8px; border: 1px solid #27272a; font-size: 14px; margin: 8px 0; color: #e4e4e7;">
          <li style="margin-bottom: 4px;"><strong>Nombre:</strong> ${usuarioNombre}</li>
          <li><strong>Correo Electrónico:</strong> <a href="mailto:${usuarioCorreo}" style="color: #34d399; text-decoration: none;">${usuarioCorreo}</a></li>
        </ul>

        <p style="font-size: 13px; color: #a1a1aa; mt-4;">
          💡 <em>Se recomienda ponerse en contacto con el usuario para ofrecerle preventas o agendar una fecha posterior a la liberación del recurso técnico.</em>
        </p>

        <p style="color: #71717a; font-size: 11px; margin-top: 24px; border-top: 1px solid #27272a; padding-top: 12px; text-align: center;">
          Notificación interna automática de e-commerce-services.
        </p>
      </div>
    `;

    // Envío del correo electrónico HACIA EL ADMINISTRADOR
    await transporter.sendMail({
      from: '"Notificaciones E-Commerce" <onboarding@resend.dev>',
      to: CORREO_ADMINISTRADOR, // 👈 Cambiado: Ahora te llega a ti
      replyTo: usuarioCorreo, // Si le das a "Responder", le responderás directo al cliente
      subject: `🚨 Interés de Cliente: ${productoNombre} (${usuarioNombre})`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error en POST /api/usuarios/auth/servicios/interes:", error);
    return NextResponse.json(
      {
        error: "Error interno al enviar la notificación",
        detalles: error.message,
      },
      { status: 500 },
    );
  }
}
