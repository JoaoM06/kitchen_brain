// Estado do formulário de personalização (planner) e construção do contexto
// enviado ao CardapioBot (manual vs. automático por estoque).
import { useCallback, useMemo, useState } from "react";

import { PROFILE_SNAPSHOT } from "../utils/cardapioConstants";

function toggleSelection(value, setter) {
  setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
}

export function useMenuGeneration() {
  const [selectedRange, setSelectedRange] = useState("Semana completa (7 dias)");
  const [selectedMeals, setSelectedMeals] = useState(["Café da manhã", "Almoço", "Jantar", "Lanches"]);
  const [dietTags, setDietTags] = useState(["Flexitariana", "Sem lactose"]);
  const [allergyNotes, setAllergyNotes] = useState(PROFILE_SNAPSHOT.allergies.join(", "));
  const [servings, setServings] = useState("2");
  const [budget, setBudget] = useState("280");
  const [timePerMeal, setTimePerMeal] = useState("35");
  const [selectedEquipment, setSelectedEquipment] = useState(["Fogão", "Air fryer", "Panela de pressão"]);
  const [selectedOrigins, setSelectedOrigins] = useState(["Brasileira caseira"]);
  const [prioritized, setPrioritized] = useState(["Peito de frango", "Espinafre"]);
  const [goal, setGoal] = useState("Organizar marmitas equilibradas da semana inteira.");
  const [contextNotes, setContextNotes] = useState(
    "Usar verduras e laticínios com vencimento próximo, evitar frituras."
  );
  const [macroTarget, setMacroTarget] = useState({ kcal: "1800", protein: "110", carbs: "180", fat: "60" });

  const handleMacroChange = useCallback(
    (field, value) => setMacroTarget((prev) => ({ ...prev, [field]: value })),
    []
  );

  const allergyList = useMemo(
    () =>
      allergyNotes
        .split(/[;,\/]/)
        .map((item) => item.trim())
        .filter(Boolean),
    [allergyNotes]
  );

  const buildRequestContext = useCallback(
    ({ messages, manualPantrySnapshot, expiringItems, lastMenuChip }) => ({
      contextMode: "manual_form",
      userProfile: PROFILE_SNAPSHOT,
      conversationHistory: messages
        .filter((m) => m.text && !m.isTyping)
        .slice(-6)
        .map((m) => ({ role: m.role, text: m.text })),
      planner: {
        period: selectedRange,
        meals: selectedMeals,
        dietTags,
        allergies: allergyList,
        servings: Number(servings) || 1,
        budgetWeeklyBRL: Number(budget) || null,
        timePerMealMinutes: Number(timePerMeal) || null,
        equipment: selectedEquipment,
        cuisines: selectedOrigins,
        prioritizedItems: prioritized,
        goal,
        macros: {
          kcal: Number(macroTarget.kcal) || null,
          protein_g: Number(macroTarget.protein) || null,
          carbs_g: Number(macroTarget.carbs) || null,
          fat_g: Number(macroTarget.fat) || null,
        },
        notes: contextNotes,
      },
      pantrySnapshot: manualPantrySnapshot,
      expiringSoon: expiringItems,
      lastMenu: lastMenuChip
        ? {
            title: lastMenuChip.title,
            dateRange: lastMenuChip.dateRange,
            generatedAt: lastMenuChip.generatedAt,
            constraints: lastMenuChip.data?.constraints || {},
          }
        : null,
    }),
    [
      selectedRange,
      selectedMeals,
      dietTags,
      allergyList,
      servings,
      budget,
      timePerMeal,
      selectedEquipment,
      selectedOrigins,
      prioritized,
      goal,
      macroTarget,
      contextNotes,
    ]
  );

  const buildDefaultContext = useCallback(
    ({ pantryItems, expiringItems }) => ({
      contextMode: "auto_stock",
      pantrySnapshot: pantryItems,
      expiringSoon: expiringItems,
    }),
    []
  );

  return {
    // estado + setters
    selectedRange,
    setSelectedRange,
    selectedMeals,
    setSelectedMeals,
    dietTags,
    setDietTags,
    allergyNotes,
    setAllergyNotes,
    servings,
    setServings,
    budget,
    setBudget,
    timePerMeal,
    setTimePerMeal,
    selectedEquipment,
    setSelectedEquipment,
    selectedOrigins,
    setSelectedOrigins,
    prioritized,
    setPrioritized,
    goal,
    setGoal,
    contextNotes,
    setContextNotes,
    macroTarget,
    handleMacroChange,
    // helpers
    toggleSelection,
    allergyList,
    buildRequestContext,
    buildDefaultContext,
  };
}
