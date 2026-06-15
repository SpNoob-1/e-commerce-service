import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const { correo, password } = await request.json();

    if (!correo || !password) {
      return NextResponse.json(
        { error: "El correo y la contraseña son obligatorios." },
        { status: 400 },
      );
    }

    // 1. Buscar al usuario por correo e incluir su rol
    const usuario = await prisma.usuario.findUnique({
      where: { correo },
      include: { rol: true },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Credenciales incorrectas." },
        { status: 401 }, // 401 Unauthorized por seguridad genérica
      );
    }

    // 2. Comparar la contraseña ingresada con el hash de la base de datos
    const passwordValido = await bcrypt.compare(password, usuario.pass_hash);

    if (!passwordValido) {
      return NextResponse.json(
        { error: "Credenciales incorrectas." },
        { status: 401 },
      );
    }

    // 3. Responder con los datos del usuario (¡Incluyendo si la clave es temporal!)
    return NextResponse.json(
      {
        mensaje: "Inicio de sesión exitoso",
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: usuario.rol.nombre,
          esPassTemporal: usuario.esPassTemporal, // 👈 Clave para obligar al cambio de clave
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error en API de Login:", error);
    return NextResponse.json(
      { error: "Error interno en el servidor" },
      { status: 500 },
    );
  }
}
