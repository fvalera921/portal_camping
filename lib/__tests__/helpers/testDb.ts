import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "prisma/migrations");

function urlDeAdministracion(): string {
  // Session pooler (o conexion directa si se define aparte): soporta bien las sentencias DDL
  // (CREATE SCHEMA, CREATE TABLE...) y mantiene una conexion de servidor estable por cliente,
  // a diferencia del Transaction pooler que usa la app en runtime (ver lib/db.ts).
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Falta DIRECT_URL o DATABASE_URL para los tests de integracion");
  }
  return url;
}

async function borrarEsquema(cliente: Client, nombreEsquema: string): Promise<void> {
  await cliente.query(`DROP SCHEMA IF EXISTS "${nombreEsquema}" CASCADE`);
}

/**
 * Crea un PrismaClient sobre un schema de Postgres nuevo y aislado (dentro de la misma base de
 * Supabase), aplicando las migraciones reales del proyecto — igual que en producción, sin
 * depender de invocar el CLI de Prisma como subproceso. Cada test file que la use debe pasar un
 * nombre de schema distinto; se borra y se vuelve a crear vacío en cada llamada.
 */
export async function crearClientePrueba(
  nombreEsquema: string,
): Promise<{ prisma: PrismaClient; nombreEsquema: string }> {
  if (!/^test_[a-z0-9_]+$/.test(nombreEsquema)) {
    throw new Error(
      `nombreEsquema invalido para BD de test: "${nombreEsquema}" (debe empezar por "test_" y usar solo minusculas/numeros/guion bajo)`,
    );
  }

  const urlBase = urlDeAdministracion();
  const admin = new Client({ connectionString: urlBase });
  await admin.connect();
  try {
    await borrarEsquema(admin, nombreEsquema);
    await admin.query(`CREATE SCHEMA "${nombreEsquema}"`);
    await admin.query(`SET search_path TO "${nombreEsquema}"`);

    const carpetasMigraciones = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
      .filter((entrada) => entrada.isDirectory())
      .map((entrada) => entrada.name)
      .sort();
    for (const carpeta of carpetasMigraciones) {
      const sql = readFileSync(path.join(MIGRATIONS_DIR, carpeta, "migration.sql"), "utf-8");
      await admin.query(sql);
    }
  } finally {
    await admin.end();
  }

  const adapter = new PrismaPg({ connectionString: urlBase }, { schema: nombreEsquema });
  const prisma = new PrismaClient({ adapter });
  return { prisma, nombreEsquema };
}

export async function cerrarClientePrueba(prisma: PrismaClient, nombreEsquema: string): Promise<void> {
  await prisma.$disconnect();
  const admin = new Client({ connectionString: urlDeAdministracion() });
  await admin.connect();
  try {
    await borrarEsquema(admin, nombreEsquema);
  } finally {
    await admin.end();
  }
}
