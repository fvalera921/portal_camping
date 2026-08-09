import Database from "better-sqlite3";
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/app/generated/prisma/client";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "prisma/migrations");
const SUFIJOS_SQLITE = ["", "-journal", "-wal", "-shm"];

function borrarFicherosDb(ruta: string): void {
  for (const sufijo of SUFIJOS_SQLITE) {
    const archivo = `${ruta}${sufijo}`;
    if (existsSync(archivo)) rmSync(archivo);
  }
}

/**
 * Crea un PrismaClient sobre un fichero SQLite nuevo y aislado, aplicando las migraciones
 * reales del proyecto (mismo schema que producción, sin depender de invocar el CLI de Prisma
 * como subproceso). Cada test file que la use debe pasar un nombre de fichero distinto.
 */
export function crearClientePrueba(nombreArchivo: string): { prisma: PrismaClient; ruta: string } {
  if (!/^test-[a-zA-Z0-9_-]+\.db$/.test(nombreArchivo)) {
    throw new Error(
      `nombreArchivo invalido para BD de test: "${nombreArchivo}" (debe empezar por "test-" y terminar en ".db")`,
    );
  }
  const ruta = path.resolve(process.cwd(), `prisma/${nombreArchivo}`);
  borrarFicherosDb(ruta);

  const db = new Database(ruta);
  try {
    const carpetasMigraciones = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
      .filter((entrada) => entrada.isDirectory())
      .map((entrada) => entrada.name)
      .sort();
    for (const carpeta of carpetasMigraciones) {
      const sql = readFileSync(path.join(MIGRATIONS_DIR, carpeta, "migration.sql"), "utf-8");
      db.exec(sql);
    }
  } finally {
    db.close();
  }

  const adapter = new PrismaBetterSqlite3({ url: `file:${ruta.replace(/\\/g, "/")}` });
  const prisma = new PrismaClient({ adapter });
  return { prisma, ruta };
}

export async function cerrarClientePrueba(prisma: PrismaClient, ruta: string): Promise<void> {
  await prisma.$disconnect();
  borrarFicherosDb(ruta);
}
