import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { correo, passwordTemporal, nuevoPassword } = await request.json();

    if (!correo || !passwordTemporal || !nuevoPassword) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios." },
        { status: 400 },
      );
    }

    // 1. Buscar al usuario
    const usuario = await prisma.usuario.findUnique({
      where: { correo: correo.toLowerCase() },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado." },
        { status: 404 },
      );
    }

    // 2. Verificar que la clave temporal ingresada sea correcta
    const passwordCorrecto = await bcrypt.compare(
      passwordTemporal,
      usuario.pass_hash,
    );
    if (!passwordCorrecto) {
      return NextResponse.json(
        { error: "La contraseña temporal ingresada es incorrecta." },
        { status: 401 },
      );
    }

    // 3. Encriptar la nueva contraseña definitiva
    const salt = await bcrypt.genSalt(10);
    const nuevoPassHash = await bcrypt.hash(nuevoPassword, salt);

    // 4. Actualizar la BD: Guardar el nuevo hash y apagar la bandera temporal
    await prisma.usuario.update({
      where: { correo: correo.toLowerCase() },
      data: {
        pass_hash: nuevoPassHash,
        esPassTemporal: false, // 👈 ¡Liberado! Ya puede navegar e iniciar sesión normalmente
      },
    });

    return NextResponse.json({
      mensaje: "Contraseña actualizada con éxito. Ya puedes iniciar sesión.",
    });
  } catch (error) {
    console.error("❌ Error en API Cambiar Clave:", error);
    return NextResponse.json(
      { error: "Error interno en el servidor" },
      { status: 500 },
    );
  }
}
