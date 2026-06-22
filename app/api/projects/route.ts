import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesion para guardar proyectos" },
        { status: 401 },
      );
    }

    const body = await req.json();

    const stmt = db.prepare(`
      INSERT INTO projects (
        userId,
        nombre,
        industria,
        pais,
        ciudad,
        inputJson,
        resultJson,
        pdfPath
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      user.id,
      body.nombre,
      body.industria,
      body.pais,
      body.ciudad,
      JSON.stringify(body.inputJson || {}),
      JSON.stringify(body.resultJson || {}),
      body.pdfPath || null,
    );

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error al guardar proyecto" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const user = getCurrentUser(req);

  if (!user) {
    return NextResponse.json(
      { error: "Debes iniciar sesion para ver proyectos" },
      { status: 401 },
    );
  }

  const projects = db
    .prepare("SELECT * FROM projects WHERE userId = ? ORDER BY createdAt DESC")
    .all(user.id);

  return NextResponse.json(projects);
}
