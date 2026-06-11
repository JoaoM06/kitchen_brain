// Helpers puros de normalização/formatação da despensa do CardapioBot.

export function formatPantryLine(item) {
  if (!item) return "";
  const pieces = [item.name?.trim()].filter(Boolean);
  if (item.quantity) pieces.push(String(item.quantity).trim());
  if (item.location) pieces.push(String(item.location).trim());
  return pieces.join(" - ");
}

export function parsePantryText(text, fallbackLocation = "Manual") {
  if (!text) return [];
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, idx) => {
      const parts = line
        .split("-")
        .map((part) => part.trim())
        .filter(Boolean);
      const [name, quantity, location] = parts;
      if (!name) return null;
      return {
        id: `manual-pantry-${idx}`,
        name,
        quantity: quantity || null,
        location: location || fallbackLocation,
        status: "manual",
      };
    })
    .filter(Boolean);
}

export function formatQuantityLabel(quantity, unit) {
  if (quantity == null) return null;
  const value = Number(quantity);
  if (Number.isFinite(value)) {
    const normalized = value % 1 === 0 ? value.toFixed(0) : value.toFixed(2).replace(/\.?0+$/, "");
    return `${normalized} ${unit || ""}`.trim();
  }
  return `${quantity} ${unit || ""}`.trim();
}

export function normalizePantryFromApi(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item, idx) => {
    const label = formatQuantityLabel(item.quantity, item.unit);
    return {
      id: item.id || `stock-${idx}`,
      name: item.name || "Item",
      quantity: label || item.quantityLabel || null,
      location: item.location || "Despensa",
      status: item.status || "ok",
      daysToExpire: item.days_to_expire ?? item.daysToExpire ?? null,
    };
  });
}
