export type Temporada = "BAJA" | "ALTA";

/** Festivos nacionales/regionales de Murcia de fecha fija, formato "MM-DD". */
const FESTIVOS_FIJOS = [
  "01-01", // Año Nuevo
  "01-06", // Reyes
  "03-19", // San José (Murcia)
  "05-01", // Fiesta del Trabajo
  "06-09", // Día de la Región de Murcia
  "08-15", // Asunción
  "10-12", // Fiesta Nacional de España
  "11-01", // Todos los Santos
  "12-06", // Día de la Constitución
  "12-08", // Inmaculada Concepción
  "12-25", // Navidad
];

/** Domingo de Resurrección para un año dado (algoritmo de Meeus/Jones/Butcher). */
function calcularDomingoDePascua(anio: number): Date {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(anio, mes - 1, dia);
}

function esMismoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Días de Semana Santa considerados temporada alta: Jueves Santo a Domingo de Resurrección. */
function diasSemanaSanta(anio: number): Date[] {
  const pascua = calcularDomingoDePascua(anio);
  const juevesSanto = new Date(pascua);
  juevesSanto.setDate(pascua.getDate() - 3);
  const viernesSanto = new Date(pascua);
  viernesSanto.setDate(pascua.getDate() - 2);
  const sabadoSanto = new Date(pascua);
  sabadoSanto.setDate(pascua.getDate() - 1);
  return [juevesSanto, viernesSanto, sabadoSanto, pascua];
}

/** Festivo nacional/regional de Murcia (fijo o Semana Santa) para una fecha dada. */
export function esFestivo(fecha: Date): boolean {
  const mmdd = `${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
  if (FESTIVOS_FIJOS.includes(mmdd)) return true;
  return diasSemanaSanta(fecha.getFullYear()).some((d) => esMismoDia(d, fecha));
}

function enumerarNoches(fechaEntrada: Date, fechaSalida: Date): Date[] {
  const noches: Date[] = [];
  const cursor = new Date(
    fechaEntrada.getFullYear(),
    fechaEntrada.getMonth(),
    fechaEntrada.getDate(),
  );
  const fin = new Date(
    fechaSalida.getFullYear(),
    fechaSalida.getMonth(),
    fechaSalida.getDate(),
  );
  while (cursor < fin) {
    noches.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return noches;
}

/**
 * Sugiere la temporada según julio/agosto, Semana Santa y festivos nacionales/regionales
 * de Murcia. Es una heurística de mejor esfuerzo (no detecta puentes); el usuario siempre
 * puede cambiar el resultado manualmente — la temporada seleccionada es la que manda.
 */
export function sugerirTemporada(fechaEntrada: Date, fechaSalida: Date): Temporada {
  const noches = enumerarNoches(fechaEntrada, fechaSalida);
  for (const noche of noches) {
    const mes = noche.getMonth() + 1;
    if (mes === 7 || mes === 8) return "ALTA";
    if (esFestivo(noche)) return "ALTA";
  }
  return "BAJA";
}
