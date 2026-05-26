import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const stmt = db.prepare(`
      INSERT INTO projects (
        nombre,
        industria,
        pais,
        ciudad,
        inputJson,
        resultJson,
        pdfPath
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
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

export async function GET() {
  const projects = db
    .prepare("SELECT * FROM projects ORDER BY createdAt DESC")
    .all();

  return NextResponse.json(projects);
}
