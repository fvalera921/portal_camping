import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const tarifas = await prisma.tarifa.findMany({ orderBy: { concepto: "asc" } });
  return NextResponse.json({ tarifas });
}
