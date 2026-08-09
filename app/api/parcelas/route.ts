import { NextRequest, NextResponse } from "next/server";
import { obtenerParcelasConEstado } from "@/lib/estadoParcela";
import { formatFechaISO, hoy, parseFechaISO } from "@/lib/fechas";

export async function GET(request: NextRequest) {
  const fechaParam = request.nextUrl.searchParams.get("fecha");
  const fecha = fechaParam ? parseFechaISO(fechaParam) : hoy();

  if (!fecha) {
    return NextResponse.json(
      { error: "Parametro 'fecha' invalido, formato esperado YYYY-MM-DD" },
      { status: 400 },
    );
  }

  const parcelas = await obtenerParcelasConEstado(fecha);
  return NextResponse.json({ fecha: formatFechaISO(fecha), parcelas });
}
