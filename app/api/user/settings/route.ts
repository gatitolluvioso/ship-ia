import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, normalizeEmail } from "@/lib/auth";
import db from "@/lib/db";

const languages = new Set(["es", "en"]);
const colorPattern = /^#[0-9a-fA-F]{6}$/;

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Debes iniciar sesion" },
      { status: 401 },
    );
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: NextRequest) {
  try {
    const user = getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesion" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const name = cleanText(body.name, 120);
    const company = cleanText(body.company, 160);
    const language = languages.has(String(body.language))
      ? String(body.language)
      : "es";
    const reportEmail = body.reportEmail
      ? normalizeEmail(String(body.reportEmail))
      : null;
    const avatarUrl = cleanText(body.avatarUrl, 500);
    const avatarInitial = cleanText(body.avatarInitial, 2)?.toUpperCase() || null;
    const avatarColor = colorPattern.test(String(body.avatarColor || ""))
      ? String(body.avatarColor)
      : "#0b63e5";

    db.prepare(
      `UPDATE users
       SET name = ?,
           company = ?,
           language = ?,
           reportEmail = ?,
           avatarUrl = ?,
           avatarInitial = ?,
           avatarColor = ?
       WHERE id = ?`,
    ).run(
      name,
      company,
      language,
      reportEmail,
      avatarUrl,
      avatarInitial,
      avatarColor,
      user.id,
    );

    const updated = db
      .prepare(
        `SELECT
          id,
          name,
          email,
          role,
          company,
          language,
          reportEmail,
          avatarUrl,
          avatarInitial,
          avatarColor
        FROM users
        WHERE id = ?`,
      )
      .get(user.id);

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "No se pudo guardar la configuracion" },
      { status: 500 },
    );
  }
}

function cleanText(value: unknown, maxLength: number) {
  const text = String(value || "").trim();
  return text ? text.slice(0, maxLength) : null;
}
