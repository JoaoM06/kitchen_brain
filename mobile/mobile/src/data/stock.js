const SECTIONS = [
  {
    id: "armario",
    title: "Armário",
    items: [
      { id: "a1", name: "Macarrão", expiry: "25/12", status: "ok" },
      { id: "a2", name: "Pão de forma", expiry: "24/10", status: "ok" },
      { id: "a3", name: "Filé Mignon", expiry: "05/11", status: "ok" },
      { id: "a4", name: "Farinha Panko", expiry: "13/02", status: "ok" },
    ],
  },
  {
    id: "geladeira",
    title: "Geladeira",
    items: [
      { id: "g1", name: "Ovo", expiry: "18/10", status: "danger" },
      { id: "g2", name: "Filé Mignon", expiry: "05/11", status: "ok" },
      { id: "g3", name: "Leite", expiry: "21/10", status: "ok" },
    ],
  },
];

export function getStockSections() {
  return SECTIONS;
}

export function getLocalStockItems() {
  return SECTIONS.flatMap((section) =>
    section.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity ?? null,
      location: section.title,
      status: item.status,
      expiresLabel: item.expiry ?? null,
    }))
  );
}

export function getLocalExpiringItems() {
  return SECTIONS.flatMap((section) =>
    section.items
      .filter((item) => item.status === "danger")
      .map((item) => ({
        id: item.id,
        name: item.name,
        expiresIn: item.expiry ? `Vence em ${item.expiry}` : "",
      }))
  );
}
