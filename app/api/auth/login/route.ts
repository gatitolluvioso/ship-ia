import { NextRequest, NextResponse } from "next/server";
import {
  createSessionResponse,
  getUserByEmail,
  normalizeEmail,
  verifyPassword,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body.email || ""));
    const password = String(body.password || "");
    const user = getUserByEmail(email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: "Correo o contrasena incorrectos." },
        { status: 401 },
      );
    }

    return createSessionResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      language: user.language,
      reportEmail: user.reportEmail,
      avatarUrl: user.avatarUrl,
      avatarInitial: user.avatarInitial,
      avatarColor: user.avatarColor,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "No se pudo iniciar sesion." },
      { status: 500 },
    );
  }
}
