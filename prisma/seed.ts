import "dotenv/config";
import { prisma } from "../lib/db";
import { eurosACentimos } from "../lib/dinero";

const TARIFAS = [
  { concepto: "ADULTOS", baja: 4.05, alta: 5.15 },
  { concepto: "NINOS", baja: 3.3, alta: 4.4 },
  { concepto: "CARAVANA", baja: 4.65, alta: 5.55 },
  { concepto: "AUTOCARAVANA", baja: 5.5, alta: 6.8 },
  { concepto: "TIENDA", baja: 4.05, alta: 5.15 },
  { concepto: "COCHE", baja: 4.05, alta: 5.15 },
  { concepto: "ELECTRICIDAD", baja: 6.55, alta: 7.65 },
  { concepto: "MOTO", baja: 3.35, alta: 4.35 },
  { concepto: "PERRO", baja: 1.3, alta: 1.3 },
  // Precio pendiente de confirmar por el cliente del proyecto — 0 € hasta entonces.
  { concepto: "FRIGORIFICO", baja: 0, alta: 0 },
] as const;

const TIPOS_PARCELA = ["TIENDA", "CARAVANA", "AUTOCARAVANA"] as const;
const NUMERO_FRIGORIFICOS = 8;

async function main() {
  for (const tarifa of TARIFAS) {
    await prisma.tarifa.upsert({
      where: { concepto: tarifa.concepto },
      update: {
        precioBajaCentimos: eurosACentimos(tarifa.baja),
        precioAltaCentimos: eurosACentimos(tarifa.alta),
      },
      create: {
        concepto: tarifa.concepto,
        precioBajaCentimos: eurosACentimos(tarifa.baja),
        precioAltaCentimos: eurosACentimos(tarifa.alta),
      },
    });
  }

  for (let numero = 1; numero <= 100; numero++) {
    const tipo = TIPOS_PARCELA[numero % TIPOS_PARCELA.length];
    const tieneElectricidad = numero % 3 !== 0;
    await prisma.parcela.upsert({
      where: { numero },
      update: {},
      create: { numero, tipo, tieneElectricidad },
    });
  }

  for (let numero = 1; numero <= NUMERO_FRIGORIFICOS; numero++) {
    await prisma.frigorifico.upsert({
      where: { numero },
      update: {},
      create: { numero },
    });
  }

  console.log(
    `Seed completado: ${TARIFAS.length} tarifas, 100 parcelas y ${NUMERO_FRIGORIFICOS} frigorificos.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
