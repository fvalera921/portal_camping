import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { cerrarClientePrueba, crearClientePrueba } from "./helpers/testDb";
import { existeSolapamiento, fechaSalidaEsValida } from "@/lib/validaciones";
import { parseFechaISO } from "@/lib/fechas";
import type { PrismaClient } from "@/app/generated/prisma/client";
import type { EstadoReserva } from "@/app/generated/prisma/enums";

describe("existeSolapamiento", () => {
  let prisma: PrismaClient;
  let nombreEsquema: string;
  let parcelaId: number;

  beforeAll(async () => {
    const cliente = await crearClientePrueba("test_solapamiento");
    prisma = cliente.prisma;
    nombreEsquema = cliente.nombreEsquema;
    const parcela = await prisma.parcela.create({
      data: { numero: 1, tipo: "TIENDA", tieneElectricidad: false },
    });
    parcelaId = parcela.id;
  });

  afterAll(async () => {
    await cerrarClientePrueba(prisma, nombreEsquema);
  });

  beforeEach(async () => {
    await prisma.reserva.deleteMany();
  });

  async function crearReserva(entrada: string, salida: string, estado: EstadoReserva = "CONFIRMADA") {
    return prisma.reserva.create({
      data: {
        parcelaId,
        fechaEntrada: parseFechaISO(entrada)!,
        fechaSalida: parseFechaISO(salida)!,
        temporada: "BAJA",
        clienteNombre: "Cliente de prueba",
        clienteDocumento: "00000000A",
        clienteTelefono: "600000000",
        totalCentimos: 0,
        estado,
      },
    });
  }

  it("no hay solapamiento en una parcela sin reservas", async () => {
    const resultado = await existeSolapamiento(prisma, parcelaId, new Date(2026, 0, 1), new Date(2026, 0, 3));
    expect(resultado).toBe(false);
  });

  it("detecta solapamiento cuando las fechas coinciden exactamente", async () => {
    await crearReserva("2026-01-01", "2026-01-05");
    expect(await existeSolapamiento(prisma, parcelaId, new Date(2026, 0, 1), new Date(2026, 0, 5))).toBe(true);
  });

  it("detecta solapamiento parcial al inicio", async () => {
    await crearReserva("2026-01-03", "2026-01-08");
    expect(await existeSolapamiento(prisma, parcelaId, new Date(2026, 0, 1), new Date(2026, 0, 5))).toBe(true);
  });

  it("detecta solapamiento parcial al final", async () => {
    await crearReserva("2026-01-01", "2026-01-05");
    expect(await existeSolapamiento(prisma, parcelaId, new Date(2026, 0, 3), new Date(2026, 0, 8))).toBe(true);
  });

  it("detecta una nueva reserva totalmente contenida en una existente", async () => {
    await crearReserva("2026-01-01", "2026-01-10");
    expect(await existeSolapamiento(prisma, parcelaId, new Date(2026, 0, 5), new Date(2026, 0, 6))).toBe(true);
  });

  it("detecta una nueva reserva que engloba totalmente a una existente", async () => {
    await crearReserva("2026-01-05", "2026-01-06");
    expect(await existeSolapamiento(prisma, parcelaId, new Date(2026, 0, 1), new Date(2026, 0, 10))).toBe(true);
  });

  it("NO hay solapamiento cuando la nueva reserva entra el mismo dia que la existente sale (contiguas)", async () => {
    await crearReserva("2026-01-01", "2026-01-05");
    expect(await existeSolapamiento(prisma, parcelaId, new Date(2026, 0, 5), new Date(2026, 0, 8))).toBe(false);
  });

  it("NO hay solapamiento cuando la nueva reserva sale el mismo dia que la existente entra (contiguas)", async () => {
    await crearReserva("2026-01-05", "2026-01-10");
    expect(await existeSolapamiento(prisma, parcelaId, new Date(2026, 0, 1), new Date(2026, 0, 5))).toBe(false);
  });

  it("una reserva CANCELADA no bloquea", async () => {
    await crearReserva("2026-01-01", "2026-01-05", "CANCELADA");
    expect(await existeSolapamiento(prisma, parcelaId, new Date(2026, 0, 1), new Date(2026, 0, 5))).toBe(false);
  });

  it("una reserva FINALIZADA no bloquea", async () => {
    await crearReserva("2026-01-01", "2026-01-05", "FINALIZADA");
    expect(await existeSolapamiento(prisma, parcelaId, new Date(2026, 0, 1), new Date(2026, 0, 5))).toBe(false);
  });

  it("una reserva EN_CURSO si bloquea", async () => {
    await crearReserva("2026-01-01", "2026-01-05", "EN_CURSO");
    expect(await existeSolapamiento(prisma, parcelaId, new Date(2026, 0, 2), new Date(2026, 0, 3))).toBe(true);
  });

  it("no se ve afectada por reservas de otra parcela", async () => {
    const otraParcela = await prisma.parcela.create({
      data: { numero: 2, tipo: "CARAVANA", tieneElectricidad: true },
    });
    await prisma.reserva.create({
      data: {
        parcelaId: otraParcela.id,
        fechaEntrada: new Date(2026, 0, 1),
        fechaSalida: new Date(2026, 0, 5),
        temporada: "BAJA",
        clienteNombre: "Cliente de prueba",
        clienteDocumento: "00000000A",
        clienteTelefono: "600000000",
        totalCentimos: 0,
      },
    });
    expect(await existeSolapamiento(prisma, parcelaId, new Date(2026, 0, 1), new Date(2026, 0, 5))).toBe(false);
  });
});

describe("fechaSalidaEsValida", () => {
  it("true cuando la salida es posterior a la entrada", () => {
    expect(fechaSalidaEsValida(new Date(2026, 0, 1), new Date(2026, 0, 2))).toBe(true);
  });

  it("false cuando son el mismo dia", () => {
    expect(fechaSalidaEsValida(new Date(2026, 0, 1), new Date(2026, 0, 1))).toBe(false);
  });

  it("false cuando la salida es anterior a la entrada", () => {
    expect(fechaSalidaEsValida(new Date(2026, 0, 2), new Date(2026, 0, 1))).toBe(false);
  });
});
