import { describe, expect, it } from "vitest";
import { calcularSubtotalCentimos, calcularTotalCentimos } from "@/lib/precios";

describe("calcularSubtotalCentimos", () => {
  it("multiplica cantidad x precio unitario x noches", () => {
    expect(calcularSubtotalCentimos(2, 515, 3)).toBe(2 * 515 * 3);
  });

  it("es 0 si la cantidad es 0", () => {
    expect(calcularSubtotalCentimos(0, 515, 3)).toBe(0);
  });

  it("es 0 si el numero de noches es 0", () => {
    expect(calcularSubtotalCentimos(2, 515, 0)).toBe(0);
  });

  it("siempre devuelve un entero (centimos), nunca decimales", () => {
    const resultado = calcularSubtotalCentimos(3, 405, 7);
    expect(Number.isInteger(resultado)).toBe(true);
    expect(resultado).toBe(8505);
  });

  it("con una sola unidad y una sola noche devuelve el precio unitario", () => {
    expect(calcularSubtotalCentimos(1, 655, 1)).toBe(655);
  });
});

describe("calcularTotalCentimos", () => {
  it("suma los subtotales de todas las lineas", () => {
    expect(
      calcularTotalCentimos([{ subtotalCentimos: 100 }, { subtotalCentimos: 250 }, { subtotalCentimos: 50 }]),
    ).toBe(400);
  });

  it("es 0 si no hay lineas", () => {
    expect(calcularTotalCentimos([])).toBe(0);
  });

  it("con una sola linea devuelve su subtotal", () => {
    expect(calcularTotalCentimos([{ subtotalCentimos: 4700 }])).toBe(4700);
  });
});
