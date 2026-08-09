import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { diferenciaEnNoches, parseFechaISO } from "@/lib/fechas";
import { calcularSubtotalCentimos, calcularTotalCentimos } from "@/lib/precios";
import {
  existeSolapamiento,
  existeSolapamientoFrigorifico,
  fechaSalidaEsValida,
} from "@/lib/validaciones";
import type { Temporada } from "@/app/generated/prisma/enums";

const TEMPORADAS_VALIDAS: readonly Temporada[] = ["BAJA", "ALTA"];
const MAX_CANTIDAD_POR_LINEA = 99;
const MAX_LINEAS = 20;
const MAX_LONGITUD_TEXTO_CORTO = 60;
const MAX_LONGITUD_TEXTO_LARGO = 200;
const CONCEPTO_FRIGORIFICO = "FRIGORIFICO";
const NUMERO_FRIGORIFICOS = 8;

type LineaEntrada = { concepto: string; cantidad: number };

type ClienteEntrada = {
  nombre: string;
  documento: string;
  telefono: string;
  email?: string;
  matricula?: string;
};

type FrigorificoEntrada = {
  numero: number;
  fechaEntrada: Date;
  fechaSalida: Date;
};

type LineaCalculada = {
  concepto: string;
  cantidad: number;
  precioUnitarioCentimos: number;
  subtotalCentimos: number;
};

function esTextoValido(valor: unknown, longitudMaxima: number, requerido: boolean): boolean {
  if (valor === undefined) return !requerido;
  return typeof valor === "string" && valor.trim().length > 0 && valor.length <= longitudMaxima;
}

function validarCliente(cliente: unknown): cliente is ClienteEntrada {
  if (!cliente || typeof cliente !== "object") return false;
  const c = cliente as Record<string, unknown>;
  return (
    esTextoValido(c.nombre, MAX_LONGITUD_TEXTO_LARGO, true) &&
    esTextoValido(c.documento, MAX_LONGITUD_TEXTO_CORTO, true) &&
    esTextoValido(c.telefono, MAX_LONGITUD_TEXTO_CORTO, true) &&
    esTextoValido(c.email, MAX_LONGITUD_TEXTO_LARGO, false) &&
    esTextoValido(c.matricula, MAX_LONGITUD_TEXTO_CORTO, false)
  );
}

function validarLineas(lineas: unknown): lineas is LineaEntrada[] {
  if (!Array.isArray(lineas) || lineas.length === 0 || lineas.length > MAX_LINEAS) return false;
  return lineas.every((linea) => {
    if (!linea || typeof linea !== "object") return false;
    const l = linea as Record<string, unknown>;
    return (
      typeof l.concepto === "string" &&
      l.concepto.length > 0 &&
      l.concepto.length <= MAX_LONGITUD_TEXTO_CORTO &&
      l.concepto !== CONCEPTO_FRIGORIFICO &&
      typeof l.cantidad === "number" &&
      Number.isInteger(l.cantidad) &&
      l.cantidad > 0 &&
      l.cantidad <= MAX_CANTIDAD_POR_LINEA
    );
  });
}

/** null = sin frigorifico; undefined = payload invalido. */
function validarFrigorifico(
  frigorifico: unknown,
  fechaEntradaReserva: Date,
  fechaSalidaReserva: Date,
): FrigorificoEntrada | null | undefined {
  if (frigorifico === undefined || frigorifico === null) return null;
  if (typeof frigorifico !== "object") return undefined;

  const f = frigorifico as Record<string, unknown>;
  if (
    typeof f.numero !== "number" ||
    !Number.isInteger(f.numero) ||
    f.numero < 1 ||
    f.numero > NUMERO_FRIGORIFICOS
  ) {
    return undefined;
  }
  if (typeof f.fechaEntrada !== "string" || typeof f.fechaSalida !== "string") {
    return undefined;
  }
  const fechaEntrada = parseFechaISO(f.fechaEntrada);
  const fechaSalida = parseFechaISO(f.fechaSalida);
  if (!fechaEntrada || !fechaSalida || !fechaSalidaEsValida(fechaEntrada, fechaSalida)) {
    return undefined;
  }
  if (fechaEntrada < fechaEntradaReserva || fechaSalida > fechaSalidaReserva) {
    return undefined;
  }
  return { numero: f.numero, fechaEntrada, fechaSalida };
}

export async function POST(request: NextRequest) {
  await getSession();

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Cuerpo de la peticion invalido" }, { status: 400 });
  }

  const {
    parcelaId,
    fechaEntrada: fechaEntradaStr,
    fechaSalida: fechaSalidaStr,
    temporada,
    cliente,
    lineas,
    frigorifico: frigorificoBody,
  } = body as Record<string, unknown>;

  if (typeof parcelaId !== "number" || !Number.isInteger(parcelaId)) {
    return NextResponse.json({ error: "parcelaId invalido" }, { status: 400 });
  }
  if (typeof fechaEntradaStr !== "string" || typeof fechaSalidaStr !== "string") {
    return NextResponse.json({ error: "Fechas invalidas" }, { status: 400 });
  }
  const fechaEntrada = parseFechaISO(fechaEntradaStr);
  const fechaSalida = parseFechaISO(fechaSalidaStr);
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
  if (typeof temporada !== "string" || !TEMPORADAS_VALIDAS.includes(temporada as Temporada)) {
    return NextResponse.json({ error: "Temporada invalida" }, { status: 400 });
  }
  if (!validarCliente(cliente)) {
    return NextResponse.json({ error: "Datos de cliente invalidos" }, { status: 400 });
  }
  if (!validarLineas(lineas)) {
    return NextResponse.json({ error: "Lineas de concepto invalidas" }, { status: 400 });
  }
  const frigorificoEntrada = validarFrigorifico(frigorificoBody, fechaEntrada, fechaSalida);
  if (frigorificoEntrada === undefined) {
    return NextResponse.json({ error: "Datos de frigorifico invalidos" }, { status: 400 });
  }

  const parcela = await prisma.parcela.findUnique({ where: { id: parcelaId } });
  if (!parcela) {
    return NextResponse.json({ error: "Parcela no encontrada" }, { status: 404 });
  }

  let frigorifico: { id: number; numero: number } | null = null;
  if (frigorificoEntrada) {
    frigorifico = await prisma.frigorifico.findUnique({
      where: { numero: frigorificoEntrada.numero },
    });
    if (!frigorifico) {
      return NextResponse.json({ error: "Frigorifico no encontrado" }, { status: 404 });
    }
  }

  const noches = diferenciaEnNoches(fechaEntrada, fechaSalida);

  const conceptosSolicitados = [...new Set(lineas.map((linea) => linea.concepto))];
  if (frigorificoEntrada) conceptosSolicitados.push(CONCEPTO_FRIGORIFICO);
  const tarifas = await prisma.tarifa.findMany({
    where: { concepto: { in: conceptosSolicitados } },
  });
  const tarifaPorConcepto = new Map(tarifas.map((tarifa) => [tarifa.concepto, tarifa]));

  const lineasCalculadas: LineaCalculada[] = [];
  for (const linea of lineas) {
    const tarifa = tarifaPorConcepto.get(linea.concepto);
    if (!tarifa) {
      return NextResponse.json(
        { error: `Concepto de tarifa desconocido: ${linea.concepto}` },
        { status: 400 },
      );
    }
    const precioUnitarioCentimos =
      temporada === "ALTA" ? tarifa.precioAltaCentimos : tarifa.precioBajaCentimos;
    lineasCalculadas.push({
      concepto: linea.concepto,
      cantidad: linea.cantidad,
      precioUnitarioCentimos,
      subtotalCentimos: calcularSubtotalCentimos(linea.cantidad, precioUnitarioCentimos, noches),
    });
  }

  if (frigorificoEntrada) {
    const tarifaFrigorifico = tarifaPorConcepto.get(CONCEPTO_FRIGORIFICO);
    if (!tarifaFrigorifico) {
      return NextResponse.json(
        { error: "Tarifa de frigorifico no configurada" },
        { status: 500 },
      );
    }
    const nochesFrigorifico = diferenciaEnNoches(
      frigorificoEntrada.fechaEntrada,
      frigorificoEntrada.fechaSalida,
    );
    const precioUnitarioCentimos =
      temporada === "ALTA" ? tarifaFrigorifico.precioAltaCentimos : tarifaFrigorifico.precioBajaCentimos;
    lineasCalculadas.push({
      concepto: CONCEPTO_FRIGORIFICO,
      cantidad: 1,
      precioUnitarioCentimos,
      subtotalCentimos: calcularSubtotalCentimos(1, precioUnitarioCentimos, nochesFrigorifico),
    });
  }

  const totalCentimos = calcularTotalCentimos(lineasCalculadas);

  try {
    const reserva = await prisma.$transaction(async (tx) => {
      if (await existeSolapamiento(tx, parcelaId, fechaEntrada, fechaSalida)) {
        throw new SolapamientoParcelaError();
      }
      if (
        frigorifico &&
        frigorificoEntrada &&
        (await existeSolapamientoFrigorifico(
          tx,
          frigorifico.id,
          frigorificoEntrada.fechaEntrada,
          frigorificoEntrada.fechaSalida,
        ))
      ) {
        throw new SolapamientoFrigorificoError();
      }
      return tx.reserva.create({
        data: {
          parcelaId,
          fechaEntrada,
          fechaSalida,
          temporada: temporada as Temporada,
          clienteNombre: cliente.nombre.trim(),
          clienteDocumento: cliente.documento.trim(),
          clienteTelefono: cliente.telefono.trim(),
          clienteEmail: cliente.email?.trim() || null,
          matricula: cliente.matricula?.trim() || null,
          frigorificoId: frigorifico?.id ?? null,
          frigorificoFechaEntrada: frigorificoEntrada?.fechaEntrada ?? null,
          frigorificoFechaSalida: frigorificoEntrada?.fechaSalida ?? null,
          totalCentimos,
          lineas: { create: lineasCalculadas },
        },
        include: { lineas: true },
      });
    });

    return NextResponse.json(reserva, { status: 201 });
  } catch (error) {
    if (error instanceof SolapamientoParcelaError) {
      return NextResponse.json(
        { error: "La parcela ya tiene una reserva que se solapa con esas fechas" },
        { status: 409 },
      );
    }
    if (error instanceof SolapamientoFrigorificoError) {
      return NextResponse.json(
        { error: "Ese frigorifico ya esta asignado en esas fechas" },
        { status: 409 },
      );
    }
    throw error;
  }
}

class SolapamientoParcelaError extends Error {}
class SolapamientoFrigorificoError extends Error {}
