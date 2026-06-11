import {
  applyUserOverrides,
  extractMealReplacement,
  extractMenuDays,
  parseMenuChip,
  shouldUseDemoCardapio,
} from "../menuParser";

const sampleMenu = {
  type: "menu_chip",
  title: "Cardápio Teste",
  dateRange: "01/01 - 07/01",
  menu: {
    dias: [
      {
        dia: "Segunda-feira",
        refeicoes: [
          { nome: "Café da manhã", itens: ["Pão e ovo"], kcal: 300, macros: { carbs_g: 1, protein_g: 1, fat_g: 1 } },
          { nome: "Almoço", itens: ["Arroz e frango"], kcal: 500 },
        ],
      },
    ],
  },
};

describe("parseMenuChip", () => {
  it("retorna cleanText quando não há bloco <MENU>", () => {
    expect(parseMenuChip("Olá, tudo bem?")).toEqual({ cleanText: "Olá, tudo bem?" });
  });

  it("retorna vazio para entrada falsy", () => {
    expect(parseMenuChip("")).toEqual({ cleanText: "" });
  });

  it("extrai o menuChip de um bloco <MENU> válido", () => {
    const raw = `Aqui está!\n<MENU>${JSON.stringify(sampleMenu)}</MENU>`;
    const result = parseMenuChip(raw);
    expect(result.menuChip).toBeDefined();
    expect(result.menuChip.title).toBe("Cardápio Teste");
    expect(result.menuChip.data.menu.dias).toHaveLength(1);
    expect(result.cleanText).toContain("Aqui está!");
  });

  it("trata JSON inválido dentro de <MENU> como texto puro", () => {
    const raw = "<MENU>{invalido}</MENU>";
    const result = parseMenuChip(raw);
    expect(result.menuChip).toBeUndefined();
    expect(result.cleanText).toBe(raw.trim());
  });
});

describe("shouldUseDemoCardapio", () => {
  it("é true para erros 503/500", () => {
    expect(shouldUseDemoCardapio({ response: { status: 503 } })).toBe(true);
    expect(shouldUseDemoCardapio({ response: { status: 500 } })).toBe(true);
  });

  it("é true para mensagens de rede/vazia conhecidas", () => {
    expect(shouldUseDemoCardapio({ message: "Resposta vazia do servidor" })).toBe(true);
    expect(shouldUseDemoCardapio({ message: "Network request failed" })).toBe(true);
  });

  it("é false para erro nulo ou comum", () => {
    expect(shouldUseDemoCardapio(null)).toBe(false);
    expect(shouldUseDemoCardapio({ message: "algo qualquer", response: { status: 400 } })).toBe(false);
  });
});

describe("extractMenuDays", () => {
  it("lê de data.menu.dias", () => {
    expect(extractMenuDays(sampleMenu)).toHaveLength(1);
  });
  it("lê de data.dias diretamente", () => {
    expect(extractMenuDays({ dias: [{ dia: "X" }] })).toHaveLength(1);
  });
  it("retorna [] quando não há dias", () => {
    expect(extractMenuDays(null)).toEqual([]);
    expect(extractMenuDays({})).toEqual([]);
  });
});

describe("extractMealReplacement", () => {
  // NOTA: no código original os patterns usam `\s` dentro de um template literal,
  // onde o escape é descartado e vira "s" — o regex fica inerte e nunca captura.
  // A refatoração PRESERVA esse comportamento (corrigir o regex seria mudança de
  // comportamento, fora do escopo do card 17).
  it("preserva o comportamento atual: retorna null (regex inerte do original)", () => {
    expect(extractMealReplacement("troque o café da manhã por tapioca", ["café da manhã", "café"])).toBeNull();
    expect(extractMealReplacement("bom dia", ["café"])).toBeNull();
  });
});

describe("applyUserOverrides", () => {
  it("não altera nada quando o texto é vazio", () => {
    const chip = { title: "X", data: sampleMenu };
    const out = applyUserOverrides(chip, "");
    expect(out.notes).toEqual([]);
    expect(out.menuChip).toBe(chip);
  });

  it("não aplica overrides locais (comportamento do original preservado)", () => {
    const chip = { title: "Cardápio Teste", data: JSON.parse(JSON.stringify(sampleMenu)) };
    const out = applyUserOverrides(chip, "troque o café da manhã por tapioca");
    expect(out.notes).toEqual([]);
    expect(out.menuChip.title).toBe("Cardápio Teste");
    const cafe = out.menuChip.data.menu.dias[0].refeicoes.find((r) => r.nome === "Café da manhã");
    expect(cafe.itens).toEqual(["Pão e ovo"]);
  });

  it("não muda o objeto original (trabalha em clone)", () => {
    const original = { title: "Cardápio Teste", data: JSON.parse(JSON.stringify(sampleMenu)) };
    applyUserOverrides(original, "troque o café por tapioca");
    expect(original.data.menu.dias[0].refeicoes[0].itens).toEqual(["Pão e ovo"]);
  });
});
