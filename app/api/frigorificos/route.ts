import { NextRequest, NextResponse } from "next/server";
import { obtenerDisponibilidadFrigorificos } from "@/lib/frigorificos";
import { parseFechaISO } from "@/lib/fechas";
import { fechaSalidaEsValida } from "@/lib/validaciones";

export async function GET(request: NextRequest) {
  const fechaEntradaParam = request.nextUrl.searchParams.get("fechaEntrada");
  const fechaSalidaParam = request.nextUrl.searchParams.get("fechaSalida");

  if (!fechaEntradaParam || !fechaSalidaParam) {
    return NextResponse.json(
      { error: "Parametros 'fechaEntrada' y 'fechaSalida' requeridos (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  const fechaEntrada = parseFechaISO(fechaEntradaParam);
  const fechaSalida = parseFechaISO(fechaSalidaParam);
  if (!fechaEntrada || !fechaSalida) {
    return NextResponse.json(
      { error: "Formato de fecha invalido, se espera YYYY-MM-DD" },
      { status: 400 },
    );
  }
  if (!fechaSalidaEsValida(fechaEntrada, fechaSalida)) {
    return NextResponse.json(
      { error: "La fecha de salida debe ser posterior a la de entrada" },
      { status: 400 },
    );
  }

  const frigorificos = await obtenerDisponibilidadFrigorificos(fechaEntrada, fechaSalida);
  return NextResponse.json({ frigorificos });
}
