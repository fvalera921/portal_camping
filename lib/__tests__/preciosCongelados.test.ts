import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cerrarClientePrueba, crearClientePrueba } from "./helpers/testDb";
import { calcularSubtotalCentimos } from "@/lib/precios";
import type { PrismaClient } from "@/app/generated/prisma/client";

describe("precios congelados en la reserva", () => {
  let prisma: PrismaClient;
  let ruta: string;
  let parcelaId: number;

  beforeAll(async () => {
    const cliente = crearClientePrueba("test-precios-congelados.db");
    prisma = cliente.prisma;
    ruta = cliente.ruta;
    const parcela = await prisma.parcela.create({
      data: { numero: 1, tipo: "TIENDA", tieneElectricidad: false },
    });
    parcelaId = parcela.id;
    await prisma.tarifa.create({
      data: { concepto: "ADULTOS", precioBajaCentimos: 405, precioAltaCentimos: 515 },
    });
  });

  afterAll(async () => {
    await cerrarClientePrueba(prisma, ruta);
  });

  it("una reserva conserva el precio aplicado aunque la tarifa cambie despues de confirmarla", async () => {
    const tarifaOriginal = await prisma.tarifa.findUniqueOrThrow({ where: { concepto: "ADULTOS" } });
    const precioUnitarioCentimos = tarifaOriginal.precioBajaCentimos;
    const subtotalCentimos = calcularSubtotalCentimos(2, precioUnitarioCentimos, 3);

    const reserva = await prisma.reserva.create({
      data: {
        parcelaId,
        fechaEntrada: new Date(2026, 0, 1),
        fechaSalida: new Date(2026, 0, 4),
        temporada: "BAJA",
        clienteNombre: "Cliente de prueba",
        clienteDocumento: "00000000A",
        clienteTelefono: "600000000",
        totalCentimos: subtotalCentimos,
        lineas: {
          create: [{ concepto: "ADULTOS", cantidad: 2, precioUnitarioCentimos, subtotalCentimos }],
        },
      },
      include: { lineas: true },
    });

    await prisma.tarifa.update({ where: { concepto: "ADULTOS" }, data: { precioBajaCentimos: 999 } });

    const lineaRecargada = await prisma.lineaConcepto.findUniqueOrThrow({
      where: { id: reserva.lineas[0].id },
    });
    const reservaRecargada = await prisma.reserva.findUniqueOrThrow({ where: { id: reserva.id } });
    const tarifaActualizada = await prisma.tarifa.findUniqueOrThrow({ where: { concepto: "ADULTOS" } });

    expect(tarifaActualizada.precioBajaCentimos).toBe(999);
    expect(lineaRecargada.precioUnitarioCentimos).toBe(precioUnitarioCentimos);
    expect(lineaRecargada.subtotalCentimos).toBe(subtotalCentimos);
    expect(reservaRecargada.totalCentimos).toBe(subtotalCentimos);
  });
});
