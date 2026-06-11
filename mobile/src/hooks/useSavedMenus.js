// Cardápios salvos no perfil: carregamento inicial e persistência.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

import { addSavedMenu, getSavedMenus } from "../storage/savedMenus";

export function useSavedMenus() {
  const [savedMenus, setSavedMenus] = useState([]);
  const [savingMenuId, setSavingMenuId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await getSavedMenus();
        if (isMounted) setSavedMenus(stored);
      } catch (err) {
        console.warn("Erro ao carregar cardápios salvos", err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveMenu = useCallback(async (menuChip) => {
    if (!menuChip) return;
    const menuId = menuChip.id || menuChip.generatedAt || `menu-${Date.now()}`;
    setSavingMenuId(menuId);

    try {
      const stored = await addSavedMenu({
        ...menuChip,
        id: menuId,
        savedAt: new Date().toISOString(),
      });
      setSavedMenus(stored);
      Alert.alert("Cardápio salvo", "Ele agora aparece no seu perfil, na aba Cardápios.");
    } catch (err) {
      console.warn("Erro ao salvar cardápio", err);
      Alert.alert("Erro", "Não foi possível salvar o cardápio agora. Tente novamente.");
    } finally {
      setSavingMenuId(null);
    }
  }, []);

  const savedMenuIds = useMemo(() => new Set(savedMenus.map((item) => item.id)), [savedMenus]);

  return { savedMenus, savedMenuIds, savingMenuId, handleSaveMenu };
}
