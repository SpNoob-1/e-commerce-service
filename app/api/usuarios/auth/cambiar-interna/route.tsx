import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { correo, passwordActual, nuevoPassword } = await request.json();

    const usuario = await prisma.usuario.findUnique({
      where: { correo: correo.toLowerCase() },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    // Validar contraseña actual
    const esValido = await bcrypt.compare(passwordActual, usuario.pass_hash);
    if (!esValido) {
      return NextResponse.json(
        { error: "La contraseña actual es incorrecta" },
        { status: 401 },
      );
    }

    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const nuevaHash = await bcrypt.hash(nuevoPassword, salt);

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { pass_hash: nuevaHash },
    });

    return NextResponse.json({ mensaje: "Contraseña actualizada" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
