import { Platform } from "react-native";

const STORAGE_KEY = "@kitchen_brain_saved_cardapios";

let asyncStorageInstance = null;

function getStorage() {
  if (Platform.OS === "web") return webStorage;
  if (!asyncStorageInstance) {
    asyncStorageInstance = require("@react-native-async-storage/async-storage").default;
  }
  return asyncStorageInstance;
}

export async function getSavedMenus() {
  const storage = getStorage();
  try {
    const raw = await storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice().sort((a, b) => {
      const aDate = new Date(a?.savedAt || a?.generatedAt || 0).getTime();
      const bDate = new Date(b?.savedAt || b?.generatedAt || 0).getTime();
      return bDate - aDate;
    });
  } catch (err) {
    console.warn("Erro ao ler cardápios salvos", err);
    return [];
  }
}

export async function addSavedMenu(menu) {
  if (!menu) return getSavedMenus();

  const storage = getStorage();
  const normalized = {
    id: menu.id || `menu-${Date.now()}`,
    title: menu.title || "Cardápio semanal",
    dateRange: menu.dateRange || "",
    data: menu.data || null,
    pdfUri: menu.pdfUri || null,
    pdfName: menu.pdfName || null,
    generatedAt: menu.generatedAt || new Date().toISOString(),
    savedAt: menu.savedAt || new Date().toISOString(),
  };

  const current = await getSavedMenus();
  const idx = current.findIndex((item) => item.id === normalized.id);
  let next = [];

  if (idx >= 0) {
    next = [...current];
    next[idx] = normalized;
  } else {
    next = [normalized, ...current];
  }

  await persist(storage, next);
  return next;
}

export async function removeSavedMenu(id) {
  if (!id) return getSavedMenus();
  const storage = getStorage();
  const current = await getSavedMenus();
  const next = current.filter((item) => item.id !== id);
  await persist(storage, next);
  return next;
}

export async function updateSavedMenu(id, updates = {}) {
  if (!id) return getSavedMenus();
  const storage = getStorage();
  const current = await getSavedMenus();
  const idx = current.findIndex((item) => item.id === id);
  if (idx === -1) return current;

  const updated = {
    ...current[idx],
    ...updates,
    id,
  };

  const next = [...current];
  next[idx] = updated;
  await persist(storage, next);
  return next;
}

async function persist(storage, list) {
  try {
    await storage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn("Erro ao salvar cardápios", err);
    throw err;
  }
}

const webStorage = {
  async getItem(key) {
    try {
      return globalThis?.localStorage?.getItem(key) ?? null;
    } catch (err) {
      console.warn("Web storage getItem falhou", err);
      return null;
    }
  },
  async setItem(key, value) {
    try {
      globalThis?.localStorage?.setItem(key, value);
    } catch (err) {
      console.warn("Web storage setItem falhou", err);
      throw err;
    }
  },
  async removeItem(key) {
    try {
      globalThis?.localStorage?.removeItem(key);
    } catch (err) {
      console.warn("Web storage removeItem falhou", err);
    }
  },
};
