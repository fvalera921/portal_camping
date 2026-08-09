import { describe, expect, it } from "vitest";
import { esFestivo, sugerirTemporada } from "@/lib/temporada";

describe("sugerirTemporada", () => {
  it("propone BAJA para una estancia en marzo fuera de festivos", () => {
    expect(sugerirTemporada(new Date(2026, 2, 2), new Date(2026, 2, 5))).toBe("BAJA");
  });

  it("propone ALTA si alguna noche cae en julio", () => {
    expect(sugerirTemporada(new Date(2026, 5, 30), new Date(2026, 6, 2))).toBe("ALTA");
  });

  it("propone ALTA para todo agosto", () => {
    expect(sugerirTemporada(new Date(2026, 7, 10), new Date(2026, 7, 15))).toBe("ALTA");
  });

  it("propone ALTA si la estancia incluye el 15 de agosto pero no julio/agosto completo", () => {
    expect(sugerirTemporada(new Date(2026, 6, 25), new Date(2026, 6, 28))).toBe("ALTA");
  });

  it("propone ALTA si incluye el Domingo de Resurrección (Semana Santa)", () => {
    // Pascua 2026 = 5 de abril
    expect(sugerirTemporada(new Date(2026, 3, 4), new Date(2026, 3, 6))).toBe("ALTA");
  });

  it("propone BAJA justo antes de Semana Santa si no la incluye", () => {
    expect(sugerirTemporada(new Date(2026, 2, 20), new Date(2026, 2, 25))).toBe("BAJA");
  });

  it("propone ALTA si incluye un festivo nacional fijo (12 de octubre)", () => {
    expect(sugerirTemporada(new Date(2026, 9, 11), new Date(2026, 9, 13))).toBe("ALTA");
  });

  it("propone ALTA si incluye el festivo regional de Murcia (9 de junio)", () => {
    expect(sugerirTemporada(new Date(2026, 5, 8), new Date(2026, 5, 10))).toBe("ALTA");
  });

  it("no cuenta la noche de salida (fechaSalida es exclusiva)", () => {
    // Entrada 30 de junio, salida 1 de julio: solo se pernocta el 30 de junio.
    expect(sugerirTemporada(new Date(2026, 5, 29), new Date(2026, 5, 30))).toBe("BAJA");
  });
});

describe("esFestivo", () => {
  it("reconoce festivos fijos", () => {
    expect(esFestivo(new Date(2026, 0, 1))).toBe(true);
    expect(esFestivo(new Date(2026, 11, 25))).toBe(true);
  });

  it("reconoce Jueves y Viernes Santo calculados dinámicamente", () => {
    // Pascua 2026 = 5 de abril → Jueves Santo 2 abril, Viernes Santo 3 abril
    expect(esFestivo(new Date(2026, 3, 2))).toBe(true);
    expect(esFestivo(new Date(2026, 3, 3))).toBe(true);
  });

  it("no marca un día laborable cualquiera como festivo", () => {
    expect(esFestivo(new Date(2026, 2, 10))).toBe(false);
  });
});
