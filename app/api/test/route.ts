import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const projects = db.prepare("SELECT * FROM projects").all();

  return NextResponse.json(projects);
}
