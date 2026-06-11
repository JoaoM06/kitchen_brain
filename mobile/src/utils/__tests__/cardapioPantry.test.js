import {
  formatPantryLine,
  formatQuantityLabel,
  normalizePantryFromApi,
  parsePantryText,
} from "../cardapioPantry";

describe("formatPantryLine", () => {
  it("junta nome, quantidade e local", () => {
    expect(formatPantryLine({ name: "Frango", quantity: "1 kg", location: "Freezer" })).toBe(
      "Frango - 1 kg - Freezer"
    );
  });
  it("ignora campos ausentes", () => {
    expect(formatPantryLine({ name: "Arroz" })).toBe("Arroz");
  });
  it("retorna vazio para item nulo", () => {
    expect(formatPantryLine(null)).toBe("");
  });
});

describe("parsePantryText", () => {
  it("transforma linhas em itens estruturados", () => {
    const out = parsePantryText("Frango - 1 kg - Freezer\nArroz - 2 kg");
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ name: "Frango", quantity: "1 kg", location: "Freezer" });
    expect(out[1]).toMatchObject({ name: "Arroz", quantity: "2 kg", location: "Manual" });
  });
  it("retorna [] para texto vazio", () => {
    expect(parsePantryText("")).toEqual([]);
  });
});

describe("formatQuantityLabel", () => {
  it("formata inteiros sem casas decimais", () => {
    expect(formatQuantityLabel(2, "kg")).toBe("2 kg");
  });
  it("formata decimais removendo zeros à direita", () => {
    expect(formatQuantityLabel(1.5, "L")).toBe("1.5 L");
  });
  it("retorna null quando a quantidade é nula", () => {
    expect(formatQuantityLabel(null, "kg")).toBeNull();
  });
});

describe("normalizePantryFromApi", () => {
  it("normaliza itens da API", () => {
    const out = normalizePantryFromApi([
      { id: "a", name: "Leite", quantity: 1, unit: "L", location: "Geladeira", status: "warn", days_to_expire: 3 },
    ]);
    expect(out[0]).toMatchObject({
      id: "a",
      name: "Leite",
      quantity: "1 L",
      location: "Geladeira",
      status: "warn",
      daysToExpire: 3,
    });
  });
  it("retorna [] para entrada não-array", () => {
    expect(normalizePantryFromApi(null)).toEqual([]);
  });
});
