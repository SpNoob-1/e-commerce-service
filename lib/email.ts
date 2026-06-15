import nodemailer from "nodemailer";

// Configuramos el transporte del correo leyendo tu archivo .env
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.ethereal.email", // Servidor SMTP de prueba por defecto
  port: Number(process.env.EMAIL_PORT) || 587,
  auth: {
    user: process.env.EMAIL_USER || "tu_usuario_prueba",
    pass: process.env.EMAIL_PASS || "tu_password_prueba",
  },
});

// Esta es la función que manda a llamar tu API de recuperación
export const enviarCorreoPasswordTemporal = async (
  correoDestino: string,
  passTemporal: string,
) => {
  const mailOptions = {
    from: '"Soporte E-Commerce" <soporte@tudominio.com>',
    to: correoDestino,
    subject: "🔑 Tu contraseña temporal de acceso",
    html: `
      <div style="font-family: sans-serif; background-color: #09090b; color: #f4f4f5; padding: 32px; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #27272a;">
        <h2 style="color: #10b981; text-align: center; font-size: 24px; margin-bottom: 24px;">Recuperación de Cuenta</h2>
        <p>Hola,</p>
        <p>Hemos recibido una solicitud para restablecer tu contraseña. El sistema ha generado la siguiente clave temporal para que puedas acceder:</p>

        <div style="background-color: #18181b; border: 1px solid #27272a; padding: 16px; text-align: center; font-size: 26px; font-weight: bold; letter-spacing: 4px; color: #ffffff; border-radius: 8px; margin: 24px 0;">
          ${passTemporal}
        </div>

        <p style="color: #a1a1aa; font-size: 14px;">⚠️ <strong>Importante:</strong> Por motivos de seguridad, tendrás que cambiar esta contraseña obligatoriamente la próxima vez que inicies sesión.</p>
        <hr style="border-color: #27272a; margin: 24px 0;" />
        <p style="font-size: 12px; color: #71717a; text-align: center;">Si tú no solicitaste este cambio, puedes ignorar este correo con total seguridad.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
