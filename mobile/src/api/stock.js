import api from "./client";

export async function confirmVoiceItems(selections) {
  const { data } = await api.post("/stock/confirm-voice", selections);
  return data;
}

export async function fetchStock({ q } = {}) {
  const params = {};
  if (q) params.q = q;

  const { data } = await api.get("/stock/list", { params });
  return data;
}

export async function updateStockItem(id, payload) {
  const { data } = await api.patch(`/stock/item/${id}`, payload);
  return data;
}

export async function deleteStockItem(id) {
  await api.delete(`/stock/item/${id}`);
}
