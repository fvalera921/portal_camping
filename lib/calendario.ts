/** Cuadricula de 7xN (lunes a domingo) para pintar un mes en un calendario; null = hueco. */
export function generarCeldasMes(anio: number, mes: number): (Date | null)[] {
  const primerDia = new Date(anio, mes, 1);
  const diaSemanaLunes0 = (primerDia.getDay() + 6) % 7;
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();

  const celdas: (Date | null)[] = [];
  for (let i = 0; i < diaSemanaLunes0; i++) celdas.push(null);
  for (let dia = 1; dia <= diasEnMes; dia++) celdas.push(new Date(anio, mes, dia));
  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
}
