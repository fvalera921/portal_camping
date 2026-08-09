import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { cerrarClientePrueba, crearClientePrueba } from "./helpers/testDb";
import { existeSolapamientoFrigorifico } from "@/lib/validaciones";
import { obtenerDisponibilidadFrigorificos } from "@/lib/frigorificos";
import { parseFechaISO } from "@/lib/fechas";
import type { PrismaClient } from "@/app/generated/prisma/client";
import type { EstadoReserva } from "@/app/generated/prisma/enums";

describe("existeSolapamientoFrigorifico / obtenerDisponibilidadFrigorificos", () => {
  let prisma: PrismaClient;
  let ruta: string;
  let parcelaId: number;
  let frigorificoAId: number;
  let frigorificoBId: number;

  beforeAll(async () => {
    const cliente = crearClientePrueba("test-frigorificos.db");
    prisma = cliente.prisma;
    ruta = cliente.ruta;
    const parcela = await prisma.parcela.create({
      data: { numero: 1, tipo: "TIENDA", tieneElectricidad: false },
    });
    parcelaId = parcela.id;
    const frigorificoA = await prisma.frigorifico.create({ data: { numero: 1 } });
    const frigorificoB = await prisma.frigorifico.create({ data: { numero: 2 } });
    frigorificoAId = frigorificoA.id;
    frigorificoBId = frigorificoB.id;
  });

  afterAll(async () => {
    await cerrarClientePrueba(prisma, ruta);
  });

  beforeEach(async () => {
    await prisma.reserva.deleteMany();
  });

  async function crearReservaConFrigorifico(
    frigorificoId: number,
    entrada: string,
    salida: string,
    estado: EstadoReserva = "CONFIRMADA",
  ) {
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
        frigorificoId,
        frigorificoFechaEntrada: parseFechaISO(entrada)!,
        frigorificoFechaSalida: parseFechaISO(salida)!,
      },
    });
  }

  it("no hay solapamiento si el frigorifico no tiene asignaciones", async () => {
    const resultado = await existeSolapamientoFrigorifico(
      prisma,
      frigorificoAId,
      new Date(2026, 0, 1),
      new Date(2026, 0, 3),
    );
    expect(resultado).toBe(false);
  });

  it("detecta solapamiento total", async () => {
    await crearReservaConFrigorifico(frigorificoAId, "2026-01-01", "2026-01-05");
    expect(
      await existeSolapamientoFrigorifico(prisma, frigorificoAId, new Date(2026, 0, 1), new Date(2026, 0, 5)),
    ).toBe(true);
  });

  it("detecta solapamiento parcial", async () => {
    await crearReservaConFrigorifico(frigorificoAId, "2026-01-01", "2026-01-05");
    expect(
      await existeSolapamientoFrigorifico(prisma, frigorificoAId, new Date(2026, 0, 3), new Date(2026, 0, 8)),
    ).toBe(true);
  });

  it("NO hay solapamiento cuando las asignaciones son contiguas", async () => {
    await crearReservaConFrigorifico(frigorificoAId, "2026-01-01", "2026-01-05");
    expect(
      await existeSolapamientoFrigorifico(prisma, frigorificoAId, new Date(2026, 0, 5), new Date(2026, 0, 8)),
    ).toBe(false);
  });

  it("una asignacion CANCELADA no bloquea", async () => {
    await crearReservaConFrigorifico(frigorificoAId, "2026-01-01", "2026-01-05", "CANCELADA");
    expect(
      await existeSolapamientoFrigorifico(prisma, frigorificoAId, new Date(2026, 0, 1), new Date(2026, 0, 5)),
    ).toBe(false);
  });

  it("una asignacion FINALIZADA no bloquea", async () => {
    await crearReservaConFrigorifico(frigorificoAId, "2026-01-01", "2026-01-05", "FINALIZADA");
    expect(
      await existeSolapamientoFrigorifico(prisma, frigorificoAId, new Date(2026, 0, 1), new Date(2026, 0, 5)),
    ).toBe(false);
  });

  it("una asignacion EN_CURSO si bloquea", async () => {
    await crearReservaConFrigorifico(frigorificoAId, "2026-01-01", "2026-01-05", "EN_CURSO");
    expect(
      await existeSolapamientoFrigorifico(prisma, frigorificoAId, new Date(2026, 0, 2), new Date(2026, 0, 3)),
    ).toBe(true);
  });

  it("no se ve afectada por asignaciones de otro frigorifico", async () => {
    await crearReservaConFrigorifico(frigorificoBId, "2026-01-01", "2026-01-05");
    expect(
      await existeSolapamientoFrigorifico(prisma, frigorificoAId, new Date(2026, 0, 1), new Date(2026, 0, 5)),
    ).toBe(false);
  });

  it("obtenerDisponibilidadFrigorificos marca ocupado solo el frigorifico y rango correctos", async () => {
    await crearReservaConFrigorifico(frigorificoAId, "2026-02-01", "2026-02-05");

    const disponibilidadDentro = await obtenerDisponibilidadFrigorificos(
      new Date(2026, 1, 2),
      new Date(2026, 1, 3),
      prisma,
    );
    const frigoADentro = disponibilidadDentro.find((f) => f.id === frigorificoAId);
    const frigoBDentro = disponibilidadDentro.find((f) => f.id === frigorificoBId);
    expect(frigoADentro?.disponible).toBe(false);
    expect(frigoBDentro?.disponible).toBe(true);

    const disponibilidadFuera = await obtenerDisponibilidadFrigorificos(
      new Date(2026, 1, 5),
      new Date(2026, 1, 8),
      prisma,
    );
    const frigoAFuera = disponibilidadFuera.find((f) => f.id === frigorificoAId);
    expect(frigoAFuera?.disponible).toBe(true);
  });
});
