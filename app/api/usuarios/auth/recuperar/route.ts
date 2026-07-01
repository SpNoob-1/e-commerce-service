import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { enviarCorreoPasswordTemporal } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { correo } = await request.json();

    if (!correo) {
      return NextResponse.json(
        { error: "El correo es obligatorio" },
        { status: 400 },
      );
    }

    // 1. Verificar si el usuario realmente existe en MySQL
    const usuario = await prisma.usuario.findUnique({
      where: { correo: correo.toLowerCase() },
    });

    if (!usuario) {
      // Requerimiento de seguridad: Éxito ficticio para evitar recolección maliciosa de correos
      return NextResponse.json({
        mensaje: "Si el correo existe, se ha enviado la clave temporal.",
      });
    }

    // 2. Generar una contraseña genérica aleatoria de 8 caracteres (según tu lógica)
    const caracteres =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#";
    let passTemporal = "";
    for (let i = 0; i < 8; i++) {
      passTemporal += caracteres.charAt(
        Math.floor(Math.random() * caracteres.length),
      );
    }

    // 3. Encriptar la contraseña temporal antes de guardarla en la base de datos
    const salt = await bcrypt.genSalt(10);
    const pass_hash = await bcrypt.hash(passTemporal, salt);

    // 4. Actualizar el usuario activando esPassTemporal en true
    await prisma.usuario.update({
      where: { correo: correo.toLowerCase() },
      data: {
        pass_hash,
        esPassTemporal: true, // 👈 Obliga al usuario a cambiarla al hacer Login
      },
    });

    // 5. Intentar enviar el correo interceptado por tu Mailtrap
    try {
      await enviarCorreoPasswordTemporal(usuario.correo, passTemporal);
      console.log(
        `📧 Clave temporal generada con éxito para desarrollo: [ ${passTemporal} ]`,
      );
    } catch (mailError) {
      console.error(
        "❌ Error al enviar el correo, pero la contraseña se actualizó en la BD:",
        mailError,
      );
    }

    return NextResponse.json({
      mensaje: "Se ha enviado una contraseña temporal a tu correo electrónico.",
    });
  } catch (error) {
    console.error("❌ Error en API Recuperar:", error);
    return NextResponse.json(
      { error: "Error interno en el servidor" },
      { status: 500 },
    );
  }
}
