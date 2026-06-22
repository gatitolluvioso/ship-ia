import { unlink } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";

type ProjectRow = {
  id: number;
  pdfPath: string | null;
};

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesion para borrar proyectos" },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const project = db
      .prepare("SELECT id, pdfPath FROM projects WHERE id = ? AND userId = ?")
      .get(id, user.id) as ProjectRow | undefined;

    if (!project) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 },
      );
    }

    db.prepare("DELETE FROM projects WHERE id = ? AND userId = ?").run(
      project.id,
      user.id,
    );

    if (project.pdfPath) {
      await deleteReportFile(project.pdfPath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "No se pudo borrar el proyecto" },
      { status: 500 },
    );
  }
}

async function deleteReportFile(publicPath: string) {
  const relativePath = publicPath.replace(/^\/+/, "");
  const filePath = path.resolve(process.cwd(), "public", relativePath);
  const reportsDir = path.resolve(process.cwd(), "public", "reports");

  if (!filePath.startsWith(reportsDir)) return;

  try {
    await unlink(filePath);
  } catch {
    // If the file is already gone, the database delete is still valid.
  }
}
