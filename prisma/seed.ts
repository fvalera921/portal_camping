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
] as const;

const TIPOS_PARCELA = ["TIENDA", "CARAVANA", "AUTOCARAVANA"] as const;

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

  console.log(`Seed completado: ${TARIFAS.length} tarifas y 100 parcelas.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
