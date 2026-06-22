import { NextRequest, NextResponse } from "next/server";
import {
  createSessionResponse,
  getUserByEmail,
  hashPassword,
  normalizeEmail,
} from "@/lib/auth";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = normalizeEmail(String(body.email || ""));
    const password = String(body.password || "");

    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { error: "Usa un correo valido y una contrasena de al menos 8 caracteres." },
        { status: 400 },
      );
    }

    if (getUserByEmail(email)) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese correo." },
        { status: 409 },
      );
    }

    const result = db
      .prepare(
        "INSERT INTO users (name, email, passwordHash, role) VALUES (?, ?, ?, ?)",
      )
      .run(name || null, email, hashPassword(password), "user");

    return createSessionResponse({
      id: Number(result.lastInsertRowid),
      name: name || null,
      email,
      role: "user",
      company: null,
      language: "es",
      reportEmail: null,
      avatarUrl: null,
      avatarInitial: null,
      avatarColor: "#0b63e5",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "No se pudo crear la cuenta." },
      { status: 500 },
    );
  }
}
