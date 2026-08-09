import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ numero: string }> },
) {
  const { numero: numeroParam } = await params;
  const numero = Number(numeroParam);

  if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
    return NextResponse.json({ error: "Numero de parcela invalido" }, { status: 400 });
  }

  const parcela = await prisma.parcela.findUnique({
    where: { numero },
    include: {
      reservas: {
        orderBy: { fechaEntrada: "desc" },
        include: { lineas: true },
      },
    },
  });

  if (!parcela) {
    return NextResponse.json({ error: "Parcela no encontrada" }, { status: 404 });
  }

  return NextResponse.json(parcela);
}
