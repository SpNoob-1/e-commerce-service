import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const { nombre, correo, password } = await request.json();

    if (!nombre || !correo || !password) {
      return NextResponse.json(
        {
          error:
            "Todos los campos (nombre, correo, contraseña) son obligatorios.",
        },
        { status: 400 },
      );
    }

    // 1. Verificar si el usuario ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { correo },
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { error: "El correo electrónico ya está registrado." },
        { status: 409 },
      );
    }

    // 2. Obtener o crear el rol "Cliente" por defecto
    let rolCliente = await prisma.rol.findUnique({
      where: { nombre: "Cliente" },
    });

    if (!rolCliente) {
      rolCliente = await prisma.rol.create({
        data: { nombre: "Cliente" },
      });
    }

    // 3. Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const pass_hash = await bcrypt.hash(password, salt);

    // 4. Crear el usuario en la base de datos
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre,
        correo,
        pass_hash,
        rolId: rolCliente.id,
        esPassTemporal: false,
      },
    });

    return NextResponse.json(
      {
        mensaje: "¡Usuario registrado con éxito!",
        usuario: {
          id: nuevoUsuario.id,
          nombre: nuevoUsuario.nombre,
          correo: nuevoUsuario.correo,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error en API de Registro:", error);
    return NextResponse.json(
      { error: "Error interno en el servidor" },
      { status: 500 },
    );
  }
}
