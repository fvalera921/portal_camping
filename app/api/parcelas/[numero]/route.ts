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
    select: {
      id: true,
      numero: true,
      tipo: true,
      tieneElectricidad: true,
      notas: true,
      reservas: {
        orderBy: { fechaEntrada: "desc" },
        select: {
          id: true,
          fechaEntrada: true,
          fechaSalida: true,
          temporada: true,
          estado: true,
          totalCentimos: true,
          clienteNombre: true,
          lineas: {
            select: { concepto: true, cantidad: true, precioUnitarioCentimos: true, subtotalCentimos: true },
          },
        },
      },
    },
  });

  if (!parcela) {
    return NextResponse.json({ error: "Parcela no encontrada" }, { status: 404 });
  }

  return NextResponse.json(parcela);
}
