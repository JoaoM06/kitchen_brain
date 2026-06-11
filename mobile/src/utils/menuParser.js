// Lógica pura de parsing/ajuste do cardápio gerado pelo CardapioBot.
// Extraída de CardapioBotScreen para permitir testes unitários e reuso.

export function extractMenuDays(data) {
  if (!data) return [];
  if (Array.isArray(data?.dias)) return data.dias;
  if (Array.isArray(data?.menu?.dias)) return data.menu.dias;
  return [];
}

export function parseMenuChip(raw) {
  if (!raw) return { cleanText: "" };
  const rx = /<MENU>([\s\S]*?)<\/MENU>/im;
  const match = raw.match(rx);
  if (!match) return { cleanText: raw.trim() };

  const before = raw.slice(0, match.index).trim();
  const after = raw.slice((match.index || 0) + match[0].length).trim();
  const cleanText = [before, after].filter(Boolean).join("\n\n").trim();

  try {
    const json = JSON.parse(match[1]);
    if (json?.type === "menu_chip") {
      return {
        cleanText: cleanText || "Claro! Aqui está o seu cardápio!",
        menuChip: {
          title: String(json.title ?? "CARDÁPIO SEMANAL"),
          dateRange: json.dateRange ? String(json.dateRange) : undefined,
          data: json,
        },
      };
    }
  } catch {
    /* JSON inválido dentro de <MENU> → trata como texto puro */
  }
  return { cleanText: raw.trim() };
}

export function shouldUseDemoCardapio(error) {
  if (!error) return false;
  const status = error?.response?.status;
  // IA indisponível/erro no backend → cai para cardápio de demonstração
  if (status === 503 || status === 500) return true;
  const msg = String(error.message || "").toLowerCase();
  return (
    msg.includes("resposta vazia") ||
    msg.includes("failed to fetch") ||
    msg.includes("network request failed") ||
    msg.includes("status code 5") ||
    msg.includes("timeout")
  );
}

export function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractMealReplacement(text, triggers) {
  const escaped = triggers.map(escapeRegExp).join("|");
  const patterns = [
    `(?:troque|substitua|mude|altere)\s+(?:o|a)?\s*(?:${escaped})[^.\n]*?(?:por|para|com)\s+([^.,;\n]+)`,
    `(?:${escaped})[^.\n]*?(?:por|para|com|:)\s+([^.,;\n]+)`,
  ];

  for (const pattern of patterns) {
    const regex = new RegExp(pattern, "i");
    const match = text.match(regex);
    if (match && match[1]) return match[1].trim();
  }
  return null;
}

export function replaceMeals(data, replacements, { force = false } = {}) {
  if (!data?.menu?.dias || replacements.length === 0) return [];
  const logs = [];

  const normalize = (str) =>
    String(str || "")
      .normalize("NFD")
      .replace(/[^a-zA-Z\s]/g, "")
      .toLowerCase();

  data.menu.dias.forEach((day) => {
    (day.refeicoes || []).forEach((meal) => {
      const mealName = normalize(meal.nome);
      replacements.forEach(({ label, replacement }) => {
        const target = normalize(label);
        if (mealName.includes(target)) {
          meal.itens = [replacement];
          meal.observacoes = "Pedido manual";
          if (meal.macros) {
            meal.macros = { carbs_g: null, protein_g: null, fat_g: null };
          }
          meal.kcal = null;
          const logLabel = `${label} → ${replacement}`;
          if (!logs.includes(logLabel)) logs.push(logLabel);
        } else if (force && target.includes("café") && mealName.includes("café")) {
          meal.itens = [replacement];
          meal.observacoes = "Pedido manual";
          if (!logs.includes(`${label} → ${replacement}`)) logs.push(`${label} → ${replacement}`);
        }
      });
    });
  });

  return logs;
}

export function applyUserOverrides(menuChip, userText, { force = false } = {}) {
  const text = userText?.trim();
  if (!text) return { menuChip, notes: [] };

  const clone = JSON.parse(JSON.stringify(menuChip));
  const notes = [];
  const replacements = [];
  const rules = [
    { label: "Café da manhã", triggers: ["café da manhã", "cafe da manha", "café", "cafe", "manhã"] },
    { label: "Almoço", triggers: ["almoço", "almoco"] },
    { label: "Lanche", triggers: ["lanche", "lanche da tarde", "lanche tarde"] },
    { label: "Jantar", triggers: ["jantar", "noite"] },
    { label: "Ceia", triggers: ["ceia", "ceia leve"] },
  ];

  rules.forEach((rule) => {
    const replacement = extractMealReplacement(text, rule.triggers);
    if (replacement) {
      replacements.push({ label: rule.label, replacement });
    }
  });

  const replaced = replaceMeals(clone.data, replacements, { force });
  replaced.forEach((item) => notes.push(item));

  if (notes.length) {
    clone.title = `${clone.title} (ajustado)`;
  }

  return { menuChip: clone, notes };
}
