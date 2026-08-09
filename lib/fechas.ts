export function inicioDia(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

export function hoy(): Date {
  return inicioDia(new Date());
}

/** Parsea una fecha en formato "YYYY-MM-DD" como fecha local (evita el desfase de `new Date(string)`, que interpreta ISO como UTC). */
export function parseFechaISO(valor: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!match) return null;
  const [, anioStr, mesStr, diaStr] = match;
  const anio = Number(anioStr);
  const mes = Number(mesStr);
  const dia = Number(diaStr);
  const fecha = new Date(anio, mes - 1, dia);
  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) {
    return null;
  }
  return fecha;
}

export function formatFechaISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export function diferenciaEnNoches(fechaEntrada: Date, fechaSalida: Date): number {
  const msPorDia = 24 * 60 * 60 * 1000;
  return Math.round(
    (inicioDia(fechaSalida).getTime() - inicioDia(fechaEntrada).getTime()) / msPorDia,
  );
}
