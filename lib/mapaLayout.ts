/**
 * Disposicion fisica real de las 100 parcelas del camping: no es una simple cuadricula
 * 10x10 en orden numerico, sino carriles que suben y bajan en bloques de 20 (11-30, 31-50,
 * 51-70, 71-90) mas dos carriles sueltos en los extremos (1-10 y 91-100), con un camino
 * (hueco visual) entre cada bloque.
 */

type ColumnaLayout = { inicio: number; direccion: "asc" | "desc" };

const FILAS = 10;

const COLUMNAS: ColumnaLayout[] = [
  { inicio: 10, direccion: "desc" }, // 10..1
  { inicio: 11, direccion: "asc" }, // 11..20
  { inicio: 30, direccion: "desc" }, // 30..21
  { inicio: 31, direccion: "asc" }, // 31..40
  { inicio: 50, direccion: "desc" }, // 50..41
  { inicio: 51, direccion: "asc" }, // 51..60
  { inicio: 70, direccion: "desc" }, // 70..61
  { inicio: 71, direccion: "asc" }, // 71..80
  { inicio: 90, direccion: "desc" }, // 90..81
  { inicio: 91, direccion: "asc" }, // 91..100
];

// Columna de grid (1-based) que ocupa cada columna de datos anterior; los huecos entre
// bloques son las columnas de grid que se saltan (2, 5, 8, 11, 14).
const COLUMNA_GRID = [1, 3, 4, 6, 7, 9, 10, 12, 13, 15];

export const NUM_COLUMNAS_GRID = 15;

export type PosicionCelda = { numero: number; fila: number; columnaGrid: number };

export function generarLayoutMapa(): PosicionCelda[] {
  const celdas: PosicionCelda[] = [];
  for (let fila = 1; fila <= FILAS; fila++) {
    COLUMNAS.forEach((columna, indice) => {
      const numero =
        columna.direccion === "asc" ? columna.inicio + (fila - 1) : columna.inicio - (fila - 1);
      celdas.push({ numero, fila, columnaGrid: COLUMNA_GRID[indice] });
    });
  }
  return celdas;
}

// minmax con un minimo (no 0) para que las celdas nunca se compriman por debajo de un tamano
// tocable en movil; si no caben todas, el contenedor hace scroll horizontal (ver MapaParcelas).
export const GRID_TEMPLATE_COLUMNAS = Array.from({ length: NUM_COLUMNAS_GRID }, (_, i) =>
  COLUMNA_GRID.includes(i + 1) ? "minmax(2.75rem,1fr)" : "0.75rem",
).join(" ");
