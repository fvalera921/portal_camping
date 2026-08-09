import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const ESTADOS_FINALES = new Set(["FINALIZADA", "CANCELADA"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await getSession();

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Id de reserva invalido" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const accion = body && typeof body === "object" ? (body as Record<string, unknown>).accion : undefined;
  if (accion !== "checkout" && accion !== "cancelar") {
    return NextResponse.json(
      { error: "accion invalida, se espera 'checkout' o 'cancelar'" },
      { status: 400 },
    );
  }

  const reserva = await prisma.reserva.findUnique({ where: { id } });
  if (!reserva) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }
  if (ESTADOS_FINALES.has(reserva.estado)) {
    return NextResponse.json(
      { error: `La reserva ya esta ${reserva.estado.toLowerCase()}` },
      { status: 409 },
    );
  }

  const nuevoEstado = accion === "checkout" ? "FINALIZADA" : "CANCELADA";
  const actualizada = await prisma.reserva.update({
    where: { id },
    data: { estado: nuevoEstado },
  });

  return NextResponse.json(actualizada);
}
