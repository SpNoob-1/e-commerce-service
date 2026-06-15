import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { enviarCorreoPasswordTemporal } from "@/lib/email"; // 👈 Asegúrate de tener este servicio en src/lib/email.ts

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
    const usuario = await prisma.usuario.findUnique({ where: { correo } });
    if (!usuario) {
      // Por seguridad, respondemos con éxito ficticio para evitar rastreo/pesca de correos
      return NextResponse.json({
        mensaje: "Si el correo existe, se ha enviado la clave temporal.",
      });
    }

    // 2. Generar una contraseña genérica aleatoria de 8 caracteres
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
      where: { correo },
      data: {
        pass_hash,
        esPassTemporal: true, // 👈 Esto obligará al usuario a cambiarla cuando inicie sesión
      },
    });

    // 5. Intentar enviar el correo (con Nodemailer)
    try {
      await enviarCorreoPasswordTemporal(correo, passTemporal);
    } catch (mailError) {
      console.error(
        "Error al enviar el correo, pero la contraseña se actualizó:",
        mailError,
      );
      // No tumbamos la API si falla el correo en desarrollo, para que puedas ver la clave en consola si es necesario
    }

    return NextResponse.json({
      mensaje: "Se ha enviado una contraseña temporal a tu correo electrónico.",
    });
  } catch (error) {
    console.error("Error en API Recuperar:", error);
    return NextResponse.json(
      { error: "Error interno en el servidor" },
      { status: 500 },
    );
  }
}
