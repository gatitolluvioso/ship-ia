import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";
import { sendReportEmail } from "@/lib/mailer";

type ProjectRow = {
  id: number;
  userId: number | null;
  nombre: string;
  pdfPath: string | null;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesion para enviar reportes" },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const project = db
      .prepare("SELECT id, userId, nombre, pdfPath FROM projects WHERE id = ? AND userId = ?")
      .get(id, user.id) as ProjectRow | undefined;

    if (!project) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 },
      );
    }

    if (!project.pdfPath) {
      return NextResponse.json(
        { error: "El proyecto aun no tiene PDF generado" },
        { status: 400 },
      );
    }

    const relativePath = project.pdfPath.replace(/^\/+/, "");
    const pdfPath = path.join(process.cwd(), "public", relativePath);
    const pdfBuffer = await readFile(pdfPath);
    const fileName = path.basename(pdfPath);

    await sendReportEmail({
      to: user.reportEmail || user.email,
      projectName: project.nombre,
      pdfBuffer,
      fileName,
    });

    return NextResponse.json({
      success: true,
      email: user.reportEmail || user.email,
    });
  } catch (error) {
    console.error(error);

    if (error instanceof Error && error.message === "SMTP_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "SMTP no esta configurado en .env.local" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "No se pudo enviar el reporte por correo" },
      { status: 500 },
    );
  }
}
