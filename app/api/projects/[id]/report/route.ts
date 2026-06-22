import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";
import { createShipReportPdf } from "@/lib/pdf-report";
import { normalizeShipResult } from "@/lib/ship-result-normalizer";

type ProjectRow = {
  id: number;
  nombre: string;
  industria: string;
  pais: string;
  ciudad: string;
  inputJson: string;
  resultJson: string | null;
  pdfPath: string | null;
  createdAt: string;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesion para generar reportes" },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const project = db
      .prepare("SELECT * FROM projects WHERE id = ? AND userId = ?")
      .get(id, user.id) as ProjectRow | undefined;

    if (!project) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 },
      );
    }

    const inputJson = safeParse(project.inputJson);
    const resultJson = normalizeShipResult(
      safeParse(project.resultJson || "{}"),
      inputJson,
    );
    const pdf = await createShipReportPdf({
      id: project.id,
      nombre: project.nombre,
      industria: project.industria,
      pais: project.pais,
      ciudad: project.ciudad,
      createdAt: project.createdAt,
      inputJson,
      resultJson: resultJson as unknown as Parameters<
        typeof createShipReportPdf
      >[0]["resultJson"],
    });

    const reportsDir = path.join(process.cwd(), "public", "reports");
    const fileName = `ship-report-${project.id}.pdf`;
    const filePath = path.join(reportsDir, fileName);
    const publicPath = `/reports/${fileName}`;

    await mkdir(reportsDir, { recursive: true });
    await writeFile(filePath, pdf);

    db.prepare("UPDATE projects SET pdfPath = ? WHERE id = ? AND userId = ?").run(
      publicPath,
      project.id,
      user.id,
    );

    return NextResponse.json({
      success: true,
      pdfPath: publicPath,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "No se pudo generar el PDF" },
      { status: 500 },
    );
  }
}

function safeParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
