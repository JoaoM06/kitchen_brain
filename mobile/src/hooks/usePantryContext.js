// Estoque (despensa) usado como contexto do CardapioBot: carrega do backend
// com fallback local, mantém a versão editável em texto e o snapshot parseado.
import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchPantry } from "../api/stock";
import { getLocalExpiringItems, getLocalStockItems } from "../data/stock";
import {
  formatPantryLine,
  normalizePantryFromApi,
  parsePantryText,
} from "../utils/cardapioPantry";

export function usePantryContext() {
  const [pantryItems, setPantryItems] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [editablePantryText, setEditablePantryText] = useState("");
  const [pantryTextDirty, setPantryTextDirty] = useState(false);

  const applyLocalStockFallback = useCallback(() => {
    const items = getLocalStockItems();
    const expiring = getLocalExpiringItems();
    setPantryItems(items);
    setExpiringItems(expiring);
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // O token é injetado pelo interceptor do client.js (ver api/stock.js).
        const data = await fetchPantry();
        if (!isMounted) return;
        const normalized = normalizePantryFromApi(data?.items);
        if (!normalized.length) {
          applyLocalStockFallback();
          return;
        }
        setPantryItems(normalized);
        const soon = normalized
          .filter((item) => typeof item.daysToExpire === "number" && item.daysToExpire <= 5)
          .map((item, idx) => ({
            id: `${item.id || `exp-${idx}`}`,
            name: item.name,
            expiresIn:
              item.daysToExpire == null
                ? ""
                : item.daysToExpire < 0
                ? "Vencido"
                : `${item.daysToExpire} dia${item.daysToExpire === 1 ? "" : "s"}`,
          }));
        setExpiringItems(soon);
      } catch (err) {
        console.warn("CardapioBot estoque", err);
        if (isMounted) applyLocalStockFallback();
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [applyLocalStockFallback]);

  useEffect(() => {
    if (pantryTextDirty) return;
    const text = pantryItems.map(formatPantryLine).join("\n");
    setEditablePantryText(text || "");
  }, [pantryItems, pantryTextDirty]);

  const manualPantrySnapshot = useMemo(() => {
    const parsed = parsePantryText(editablePantryText);
    return parsed.length ? parsed : pantryItems;
  }, [editablePantryText, pantryItems]);

  return {
    pantryItems,
    expiringItems,
    editablePantryText,
    setEditablePantryText,
    setPantryTextDirty,
    manualPantrySnapshot,
  };
}
