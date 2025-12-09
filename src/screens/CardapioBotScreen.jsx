// mobile/src/screens/CardapioBotScreen.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
  Alert,
  Pressable,
  ScrollView,
  Switch,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";

import SafeScreen from "../components/SafeScreen";
import FooterNav from "../components/FooterNav";
import { colors } from "../theme/colors";
import { addSavedMenu, getSavedMenus } from "../storage/savedMenus";
import { BASE_URL } from "../api/client";
import { getLocalStockItems, getLocalExpiringItems } from "../data/stock";
import { generateMenuPdf } from "../utils/menuPdf";

const GEMINI_MODEL = "gemini-2.5-flash-lite";
const API_KEY = "AIzaSyAH6qpSJoleMZT7XcfkEPK8ThJegPHKjGw";

const EMOJIS = ["😀","😁","😂","😊","😍","😋","😎","🤔","🙌","👍","👎","🥗","🍲","🍛","🍳","🥪","🍎","🥦","🧀","🥖","🍗"];

const STARTER_BOT_MSG = {
  id: "m0",
  role: "bot",
  text:
    "Bom dia! Sou seu assistente de geração de cardápios! Inicie uma conversa comigo para que eu possa te auxiliar a montar o melhor cardápio possível para você!",
};

const PROFILE_SNAPSHOT = {
  name: "Thaís Paiva",
  dietaryStyle: ["Flexitariana", "Sem lactose"],
  allergies: ["Lactose", "Camarão"],
  goals: ["Marmitas equilibradas", "Reduzir ultraprocessados"],
  macros: { kcal: 1800, protein: 110, carbs: 180, fat: 60 },
};

const SAMPLE_PANTRY_PLACEHOLDER = getLocalStockItems().slice(0, 2);

function formatPantryLine(item) {
  if (!item) return "";
  const pieces = [item.name?.trim()].filter(Boolean);
  if (item.quantity) pieces.push(String(item.quantity).trim());
  if (item.location) pieces.push(String(item.location).trim());
  return pieces.join(" - ");
}

function parsePantryText(text, fallbackLocation = "Manual") {
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

function formatQuantityLabel(quantity, unit) {
  if (quantity == null) return null;
  const value = Number(quantity);
  if (Number.isFinite(value)) {
    const normalized = value % 1 === 0 ? value.toFixed(0) : value.toFixed(2).replace(/\.?0+$/, "");
    return `${normalized} ${unit || ""}`.trim();
  }
  return `${quantity} ${unit || ""}`.trim();
}

function normalizePantryFromApi(items) {
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

const QUICK_PROMPTS = [
  {
    id: "qp1",
    label: "Batch cooking",
    prompt: "Monte um plano de {range} focado em batch cooking usando {prioritized} e tempo máximo de {tempo} minutos por refeição.",
  },
  {
    id: "qp2",
    label: "Despensa primeiro",
    prompt: "Gere cardápio econômico priorizando itens disponíveis: {pantry}. Inclua lista de compras ao final.",
  },
  {
    id: "qp3",
    label: "Metas de macro",
    prompt: "Preciso de {meals} atendendo {macros}. Informe kcal e macros por refeição.",
  },
];

const RANGE_OPTIONS = [
  "Semana completa (7 dias)",
  "Seg. a Sex.",
  "Só fim de semana",
  "Período personalizado",
];

const MEAL_OPTIONS = ["Café da manhã", "Almoço", "Jantar", "Lanches", "Ceia leve"];
const DIET_OPTIONS = ["Flexitariana", "Vegetariana", "Low-carb", "Rica em proteínas", "Sem lactose", "Anti-inflamatória"];
const EQUIPMENT_OPTIONS = ["Fogão", "Air fryer", "Forno", "Micro-ondas", "Panela de pressão", "Liquidificador"];
const CUISINE_OPTIONS = ["Brasileira caseira", "Mediterrânea", "Italiana leve", "Asiática", "Comfort food"];
const PRIORITY_OPTIONS = ["Peito de frango", "Abóbora cabotiá", "Espinafre", "Grão-de-bico", "Quinoa", "Queijos duros"];

const MOCK_MENU_PAYLOAD = {
  type: "menu_chip",
  title: "Cardápio Semanal Demo",
  dateRange: "08/07 - 14/07",
  servings: 2,
  constraints: {
    diet: ["Flexitariana", "Sem lactose"],
    exclusions: ["Lactose", "Camarão"],
    budget: { currency: "BRL", period: "weekly", max: 280 },
    timePerMealMinutes: 35,
    equipment: ["Fogão", "Air fryer", "Panela de pressão"],
    origins: ["Brasileira caseira"],
  },
  assumptions: [
    "Sem eventos especiais durante a semana.",
    "Preferência por refeições que gerem sobras para o dia seguinte.",
  ],
  menu: {
    dias: [
      {
        dia: "Segunda-feira",
        refeicoes: [
          {
            nome: "Café da manhã",
            itens: ["Overnight oats com chia, morango e castanhas"],
            kcal: 350,
            macros: { carbs_g: 45, protein_g: 18, fat_g: 12 },
            prep: ["Misturar e deixar na geladeira"],
            observacoes: null,
          },
          {
            nome: "Almoço",
            itens: ["Frango grelhado com molho de ervas", "Purê de abóbora cabotiá", "Salada verde com espinafre"],
            kcal: 520,
            macros: { carbs_g: 48, protein_g: 42, fat_g: 18 },
            prep: ["Grelhar frango", "Bater purê"],
            observacoes: "Render 2 marmitas",
          },
          {
            nome: "Lanche",
            itens: ["Homus de grão-de-bico com palitos de cenoura"],
            kcal: 210,
            macros: { carbs_g: 18, protein_g: 8, fat_g: 11 },
            prep: [],
            observacoes: null,
          },
          {
            nome: "Jantar",
            itens: ["Panqueca integral de espinafre e ricota sem lactose"],
            kcal: 460,
            macros: { carbs_g: 52, protein_g: 30, fat_g: 14 },
            prep: ["Assar panquecas"],
            observacoes: null,
          },
        ],
      },
      {
        dia: "Terça-feira",
        refeicoes: [
          {
            nome: "Café da manhã",
            itens: ["Tapioca com ovos mexidos e tomate"],
            kcal: 340,
            macros: { carbs_g: 32, protein_g: 20, fat_g: 12 },
            prep: [],
            observacoes: null,
          },
          {
            nome: "Almoço",
            itens: ["Bowl morno de grão-de-bico, quinoa, legumes assados"],
            kcal: 510,
            macros: { carbs_g: 55, protein_g: 26, fat_g: 16 },
            prep: ["Assar legumes"],
            observacoes: "Aproveitar sobras",
          },
          {
            nome: "Lanche",
            itens: ["Maçã com pasta de amendoim"],
            kcal: 190,
            macros: { carbs_g: 24, protein_g: 6, fat_g: 8 },
            prep: [],
            observacoes: null,
          },
          {
            nome: "Jantar",
            itens: ["Sopa cremosa de abóbora com gengibre", "Croutons integrais"],
            kcal: 430,
            macros: { carbs_g: 48, protein_g: 18, fat_g: 14 },
            prep: ["Bater sopa"],
            observacoes: "Congelar porções",
          },
        ],
      },
      {
        dia: "Quarta-feira",
        refeicoes: [
          {
            nome: "Café da manhã",
            itens: ["Smoothie verde com espinafre, abacaxi e proteína vegetal"],
            kcal: 300,
            macros: { carbs_g: 40, protein_g: 22, fat_g: 6 },
            prep: [],
            observacoes: null,
          },
          {
            nome: "Almoço",
            itens: ["Frango desfiado ao molho de tomate fresco", "Arroz integral com linhaça", "Brócolis no vapor"],
            kcal: 540,
            macros: { carbs_g: 58, protein_g: 40, fat_g: 16 },
            prep: ["Desfiar frango"],
            observacoes: "Montar 2 marmitas",
          },
          {
            nome: "Lanche",
            itens: ["Iogurte sem lactose com granola caseira"],
            kcal: 220,
            macros: { carbs_g: 26, protein_g: 12, fat_g: 8 },
            prep: [],
            observacoes: null,
          },
          {
            nome: "Jantar",
            itens: ["Frittata de abobrinha e espinafre feita na air fryer"],
            kcal: 420,
            macros: { carbs_g: 22, protein_g: 32, fat_g: 20 },
            prep: ["Assar na air fryer"],
            observacoes: null,
          },
        ],
      },
      {
        dia: "Quinta-feira",
        refeicoes: [
          {
            nome: "Café da manhã",
            itens: ["Pão integral com pasta de grão-de-bico e rúcula"],
            kcal: 330,
            macros: { carbs_g: 38, protein_g: 16, fat_g: 10 },
            prep: [],
            observacoes: null,
          },
          {
            nome: "Almoço",
            itens: ["Quinoa com cubos de frango assado", "Abobrinha salteada", "Vinagrete de feijão-fradinho"],
            kcal: 530,
            macros: { carbs_g: 52, protein_g: 38, fat_g: 15 },
            prep: ["Assar frango em cubos"],
            observacoes: "Guardar porções para sexta",
          },
          {
            nome: "Lanche",
            itens: ["Mix de castanhas e frutas secas"],
            kcal: 240,
            macros: { carbs_g: 20, protein_g: 6, fat_g: 16 },
            prep: [],
            observacoes: null,
          },
          {
            nome: "Jantar",
            itens: ["Crepioca de peito de peru sem lactose", "Salada de folhas"],
            kcal: 410,
            macros: { carbs_g: 32, protein_g: 28, fat_g: 14 },
            prep: ["Preparar crepioca"],
            observacoes: null,
          },
        ],
      },
      {
        dia: "Sexta-feira",
        refeicoes: [
          {
            nome: "Café da manhã",
            itens: ["Panquecas de banana com aveia e mel"] ,
            kcal: 360,
            macros: { carbs_g: 50, protein_g: 14, fat_g: 10 },
            prep: ["Bater massa e grelhar"],
            observacoes: null,
          },
          {
            nome: "Almoço",
            itens: ["Tigela de frango desfiado com legumes tostados", "Farofa de linhaça"],
            kcal: 540,
            macros: { carbs_g: 54, protein_g: 36, fat_g: 18 },
            prep: ["Reaproveitar frango e legumes de quinta"],
            observacoes: "Perfeito para marmita" ,
          },
          {
            nome: "Lanche",
            itens: ["Iogurte vegetal com coulis de frutas vermelhas"],
            kcal: 210,
            macros: { carbs_g: 26, protein_g: 9, fat_g: 8 },
            prep: ["Aquecer frutas com chia"],
            observacoes: null,
          },
          {
            nome: "Jantar",
            itens: ["Moqueca leve de grão-de-bico com arroz de coco"],
            kcal: 480,
            macros: { carbs_g: 50, protein_g: 22, fat_g: 18 },
            prep: ["Refogar base e finalizar com coco"],
            observacoes: null,
          },
        ],
      },
      {
        dia: "Sábado",
        refeicoes: [
          {
            nome: "Café da manhã",
            itens: ["Cuscuz nordestino com ovo pochê e tomate"],
            kcal: 380,
            macros: { carbs_g: 46, protein_g: 20, fat_g: 12 },
            prep: [],
            observacoes: null,
          },
          {
            nome: "Almoço",
            itens: ["Lasanha de abobrinha com ricota sem lactose", "Salada morna de grão-de-bico"],
            kcal: 560,
            macros: { carbs_g: 48, protein_g: 34, fat_g: 20 },
            prep: ["Assar lasanha"],
            observacoes: "Rende almoço de domingo" ,
          },
          {
            nome: "Lanche",
            itens: ["Suco verde detox"],
            kcal: 150,
            macros: { carbs_g: 32, protein_g: 6, fat_g: 2 },
            prep: ["Bater no liquidificador"],
            observacoes: null,
          },
          {
            nome: "Jantar",
            itens: ["Risoto de quinoa com cogumelos e espinafre"],
            kcal: 470,
            macros: { carbs_g: 45, protein_g: 24, fat_g: 16 },
            prep: ["Hidratar quinoa"],
            observacoes: null,
          },
        ],
      },
      {
        dia: "Domingo",
        refeicoes: [
          {
            nome: "Brunch",
            itens: ["Waffles integrais com frutas", "Ovos mexidos com ervas"],
            kcal: 520,
            macros: { carbs_g: 60, protein_g: 28, fat_g: 16 },
            prep: ["Preparar waffles"],
            observacoes: null,
          },
          {
            nome: "Almoço",
            itens: ["Panelinha de frango com legumes assados", "Arroz integral com coco"],
            kcal: 560,
            macros: { carbs_g: 54, protein_g: 38, fat_g: 18 },
            prep: ["Assar tudo em travessa única"],
            observacoes: "Garantir sobras para segunda" ,
          },
          {
            nome: "Lanche",
            itens: ["Bolo de banana sem lactose"],
            kcal: 260,
            macros: { carbs_g: 36, protein_g: 8, fat_g: 10 },
            prep: ["Assar bolo"],
            observacoes: null,
          },
          {
            nome: "Jantar",
            itens: ["Sopa cremosa de legumes assados", "Torradas integrais"],
            kcal: 420,
            macros: { carbs_g: 46, protein_g: 18, fat_g: 14 },
            prep: ["Bater legumes já assados"],
            observacoes: "Congelar porções extras",
          },
        ],
      },
    ],
  },
  shoppingList: [
    {
      categoria: "Hortifruti",
      itens: [
        { nome: "Folhas variadas", quantidade: "6 maços", observacao: "Preferir orgânicas" },
        { nome: "Abóbora cabotiá", quantidade: "2 kg", observacao: "Guardar porções" },
        { nome: "Frutas vermelhas", quantidade: "400 g", observacao: "Congelar" },
      ],
    },
    {
      categoria: "Proteínas",
      itens: [
        { nome: "Peito de frango", quantidade: "2 kg", observacao: "Dividir em porções" },
        { nome: "Grão-de-bico", quantidade: "1 kg", observacao: "Deixar de molho" },
      ],
    },
    {
      categoria: "Mercearia",
      itens: [
        { nome: "Quinoa", quantidade: "1 kg", observacao: "Usar em bowls e risoto" },
        { nome: "Aveia em flocos", quantidade: "500 g", observacao: "Café e lanches" },
      ],
    },
  ],
  prepBatching: [
    {
      dia: "Domingo",
      tarefas: ["Assar legumes variados", "Cozinhar grão-de-bico e congelar", "Preparar base de molho de tomate"],
    },
    {
      dia: "Quarta-feira",
      tarefas: ["Hidratar e cozinhar quinoa", "Fracionar castanhas e frutas secas"],
    },
  ],
  substitutions: [{ original: "Ricota", alternativas: ["Tofu firme", "Creme de castanhas"] }],
  costEstimate: {
    currency: "BRL",
    total: 260,
    porDia: 37,
    assumptions: ["Valores médios de supermercados em SP/2024"],
  },
};

const MOCK_MENU_RESPONSE = `<MENU>${JSON.stringify(MOCK_MENU_PAYLOAD)}</MENU>`;

export default function CardapioBotScreen({ navigation }) {
  const [messages, setMessages] = useState([STARTER_BOT_MSG]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  const [selectedRange, setSelectedRange] = useState(RANGE_OPTIONS[0]);
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
  const [contextNotes, setContextNotes] = useState("Usar verduras e laticínios com vencimento próximo, evitar frituras.");
  const [macroTarget, setMacroTarget] = useState({ kcal: "1800", protein: "110", carbs: "180", fat: "60" });
  const [lastMenuChip, setLastMenuChip] = useState(null);
  const [savedMenus, setSavedMenus] = useState([]);
  const [savingMenuId, setSavingMenuId] = useState(null);
  const [useManualContext, setUseManualContext] = useState(false);
  const [pantryItems, setPantryItems] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [editablePantryText, setEditablePantryText] = useState("");
  const [pantryTextDirty, setPantryTextDirty] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const headerHeight = useHeaderHeight();

  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidShow", () => setShowEmoji(false));
    return () => sub.remove();
  }, []);

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
        const token = await AsyncStorage.getItem("auth_token");
        if (!token) {
          applyLocalStockFallback();
          return;
        }
        const res = await fetch(`${BASE_URL}/me/pantry`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Pantry HTTP ${res.status}`);
        const data = await res.json();
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

  const allergyList = useMemo(
    () =>
      allergyNotes
        .split(/[;,\/]/)
        .map((item) => item.trim())
        .filter(Boolean),
    [allergyNotes]
  );

  const manualPantrySnapshot = useMemo(() => {
    const parsed = parsePantryText(editablePantryText);
    return parsed.length ? parsed : pantryItems;
  }, [editablePantryText, pantryItems]);

  const requestContext = useMemo(
    () => ({
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
    [messages, selectedRange, selectedMeals, dietTags, allergyList, servings, budget, timePerMeal, selectedEquipment, selectedOrigins, prioritized, goal, macroTarget, contextNotes, lastMenuChip, expiringItems, manualPantrySnapshot]
  );

  const defaultContext = useMemo(
    () => ({
      contextMode: "auto_stock",
      pantrySnapshot: pantryItems,
      expiringSoon: expiringItems,
    }),
    [pantryItems, expiringItems]
  );

  const savedMenuIds = useMemo(() => new Set(savedMenus.map((item) => item.id)), [savedMenus]);

  const canSend = text.trim().length > 0 && !loading;

  const callGemini = async (body, retries = 3) => {
    if (!API_KEY) throw new Error("Falta GEMINI_API_KEY em app.json -> extra");
    setLoading(true);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");

          // Se for erro 503 (overloaded) ou 429 (rate limit), tenta novamente
          if ((res.status === 503 || res.status === 429) && attempt < retries) {
            const waitTime = Math.min(1000 * Math.pow(2, attempt), 8000); // Backoff exponencial até 8s
            console.log(`⏳ Gemini sobrecarregado. Tentando novamente em ${waitTime/1000}s... (${attempt + 1}/${retries})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }

          throw new Error(`Gemini HTTP ${res.status}: ${txt}`);
        }

        const data = await res.json();
        setLoading(false);

        const txt =
          data?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join("\n")?.trim() || "";
        if (!txt) throw new Error("Resposta vazia do Gemini");
        return txt;

      } catch (error) {
        if (attempt === retries) {
          setLoading(false);
          throw error;
        }
        // Se for erro de rede, tenta novamente
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 8000);
        console.log(`⚠️ Erro de conexão. Tentando novamente em ${waitTime/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  };

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

  const handleQuickPrompt = (prompt) => {
    const replacements = {
      "{range}": selectedRange,
      "{prioritized}": prioritized.join(", "),
      "{tempo}": `${timePerMeal} min`,
      "{pantry}": pantryItems.map((p) => p.name).join(", "),
      "{meals}": selectedMeals.join(", "),
      "{macros}": `${macroTarget.kcal} kcal / ${macroTarget.protein}g proteína`,
    };
    const filled = Object.keys(replacements).reduce((acc, key) => acc.split(key).join(replacements[key]), prompt);
    setText(filled);
    setShowEmoji(false);
    inputRef.current?.focus?.();
  };

  const handleSend = async () => {
    const content = text.trim();
    if (!content) return;

    const baseId = Date.now();
    const userMsg = { id: String(baseId), role: "user", text: content };
    const shouldUseManualContext = useManualContext;
    const promptContext = shouldUseManualContext ? requestContext : defaultContext;
    const prompt = buildPrompt(content, promptContext);
    const requestBody = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, topP: 0.95, topK: 40, maxOutputTokens: 9000 },
    };
    setMessages((prev) => [...prev, userMsg, { id: "typing", role: "bot", isTyping: true }]);
    setText("");
    setShowEmoji(false);
    scrollToEnd();

    try {
      const reply = await callGemini(requestBody);
      await finishWithParsedMenu(parseMenuChip(reply), { userText: content });
    } catch (e) {
      console.warn("CardapioBot", e);
      if (shouldUseDemoCardapio(e)) {
        await finishWithParsedMenu(parseMenuChip(MOCK_MENU_RESPONSE), {
          defaultText:
            "Não consegui falar com o Gemini agora, então gerei um cardápio de demonstração para você continuar testando.",
          userText: content,
          isFallback: true,
        });
      } else {
        // Mensagem de erro mais específica
        let errorMessage = "Ops! Não consegui falar com o Gemini agora.";

        if (e.message?.includes("503")) {
          errorMessage = "😔 O servidor do Gemini está sobrecarregado no momento. Por favor, aguarde alguns minutos e tente novamente.";
        } else if (e.message?.includes("429")) {
          errorMessage = "⏱️ Você atingiu o limite de requisições. Aguarde um momento antes de tentar novamente.";
        } else if (e.message?.includes("401") || e.message?.includes("403")) {
          errorMessage = "🔑 Erro de autenticação. Verifique sua chave API (GEMINI_API_KEY).";
        } else if (e.message?.includes("network") || e.message?.includes("fetch")) {
          errorMessage = "📡 Erro de conexão com a internet. Verifique sua rede e tente novamente.";
        }

        const botErr = {
          id: String(Date.now() + 1),
          role: "bot",
          error: true,
          text: errorMessage,
        };
        setMessages((prev) => prev.filter((m) => m.id !== "typing").concat(botErr));
      }
    } finally {
      setLoading(false);
    }
  };

  const sharePdf = useCallback(async (uri, name = "Cardápio em PDF") => {
    if (!uri) {
      Alert.alert("PDF", "Não há arquivo disponível ainda. Gere um novo cardápio.");
      return;
    }

    try {
      const finalName = name?.toLowerCase?.().endsWith(".pdf") ? name : `${name || "cardapio"}.pdf`;

      if (Platform.OS === "web") {
        const hasDocument = typeof document !== "undefined";
        if (hasDocument) {
          const downloadLink = document.createElement("a");
          const response = await fetch(uri);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          downloadLink.href = url;
          downloadLink.download = finalName;
          downloadLink.style.display = "none";
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(url);
        } else if (typeof window !== "undefined") {
          window.open(uri, "_blank");
        } else {
          Alert.alert("PDF gerado", `${finalName}\n${uri}`);
        }
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: finalName,
        });
      } else {
        Alert.alert("PDF gerado", `${finalName}\n${uri}`);
      }
    } catch (err) {
      Alert.alert("Erro", "Não foi possível abrir/compartilhar o PDF.");
    }
  }, []);

  const handleGeneratePdf = useCallback(
    async (menuChip, messageId) => {
      if (!menuChip) return;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, generatingPdf: true, error: false } : m
        )
      );

      try {
        const pdfFile = await generateMenuPdf(menuChip);

        if (Platform.OS === "web") {
          Alert.alert("PDF", "Cardápio preparado! Verifique seus downloads.");
        } else if (pdfFile?.uri) {
          await sharePdf(pdfFile.uri, pdfFile.name);
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  generatingPdf: false,
                  showPdfButton: false,
                  text: "PDF gerado! Confira seus downloads.",
                }
              : m
          )
        );
      } catch (err) {
        console.warn("Erro ao gerar PDF:", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  generatingPdf: false,
                  error: true,
                  text: "Erro ao gerar o PDF. Tente novamente.",
                }
              : m
          )
        );
      }
    },
    [sharePdf]
  );

  const renderManualContext = useCallback(
    () => (
      <View style={styles.manualContextWrapper}>
        <ScrollView
          nestedScrollEnabled
          contentContainerStyle={styles.manualContextScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroEyebrow}>Assistente IA</Text>
              <Text style={styles.heroTitle}>Oi, {PROFILE_SNAPSHOT.name.split(" ")[0]}!</Text>
              <Text style={styles.heroSubtitle}>
                Conte o que precisa e eu gero um cardápio completo seguindo preferências, estoque e metas.
              </Text>
            </View>
            <InfoBadge label="Modelo" value={GEMINI_MODEL} compact />
          </View>

          <Section title="Resumo rápido" description="Dados vindos do perfil e onboarding.">
            <View style={styles.badgeRow}>
              <InfoBadge label="Estilo alimentar" value={PROFILE_SNAPSHOT.dietaryStyle.join(", ")} />
              <InfoBadge label="Alergias" value={PROFILE_SNAPSHOT.allergies.join(" • ")} variant="warning" />
            </View>
            <View style={styles.badgeRow}>
              <InfoBadge label="Metas" value={PROFILE_SNAPSHOT.goals.join(", ")} />
              <InfoBadge label="Meta calórica" value={`${PROFILE_SNAPSHOT.macros.kcal} kcal`} />
            </View>
          </Section>

          {lastMenuChip && (
            <Section title="Último cardápio gerado" description="Use como referência para manter consistência.">
              <Text style={styles.lastMenuTitle}>{lastMenuChip.title}</Text>
              {lastMenuChip.dateRange && <Text style={styles.lastMenuRange}>{lastMenuChip.dateRange}</Text>}
              <Text style={styles.lastMenuStamp}>
                Atualizado em {new Date(lastMenuChip.generatedAt).toLocaleString("pt-BR")}
              </Text>
              <View style={styles.badgeRow}>
                {(lastMenuChip.data?.constraints?.diet || []).map((item) => (
                  <Chip key={item} label={item} selected />
                ))}
              </View>
            </Section>
          )}

          <Section title="Itens para priorizar" description="Aproveite antes de vencer.">
            {expiringItems.length ? (
              expiringItems.map((item) => (
                <View key={item.id} style={styles.expiringRow}>
                  <Text style={styles.expiringName}>{item.name}</Text>
                  {!!item.expiresIn && <Text style={styles.expiringTag}>{item.expiresIn}</Text>}
                </View>
              ))
            ) : (
              <Text style={styles.helperText}>Nenhum item com vencimento próximo.</Text>
            )}
          </Section>

          <Section title="Estoque enviado para o Gemini" description="Edite a lista ou escreva novos itens.">
            <TextInput
              style={[styles.textArea, styles.pantryEditor]}
              value={editablePantryText}
              onChangeText={(value) => {
                setPantryTextDirty(true);
                setEditablePantryText(value);
              }}
              multiline
              scrollEnabled
              textAlignVertical="top"
              placeholder="Peito de frango - 1,2 kg - Freezer"
            />
            <Text style={styles.helperText}>Formato sugerido: ingrediente - quantidade - local (um por linha).</Text>
            <View style={styles.pantryGrid}>
              {(pantryItems.length ? pantryItems : SAMPLE_PANTRY_PLACEHOLDER).map((item) => {
                const qty =
                  typeof item.quantity === "string"
                    ? item.quantity
                    : item.quantity
                    ? String(item.quantity)
                    : null;
                return (
                  <View key={item.id} style={styles.pantryPill}>
                    <Text style={styles.pantryName}>{item.name}</Text>
                    <Text style={styles.pantryMeta}>
                      {qty || "Qtd. não informada"} • {item.location || "Local não informado"}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Section>

          <Section title="Período e refeições" description="Selecione dias e refeições desejados.">
            <Text style={styles.sectionLabel}>Período</Text>
            <View style={styles.pillRow}>
              {RANGE_OPTIONS.map((option) => (
                <Chip key={option} label={option} selected={selectedRange === option} onPress={() => setSelectedRange(option)} />
              ))}
            </View>

            <Text style={styles.sectionLabel}>Refeições</Text>
            <View style={styles.pillRow}>
              {MEAL_OPTIONS.map((meal) => (
                <Chip
                  key={meal}
                  label={meal}
                  selected={selectedMeals.includes(meal)}
                  onPress={() => toggleSelection(meal, setSelectedMeals)}
                />
              ))}
            </View>
          </Section>

          <Section title="Preferências & restrições" description="Atualize quando algo mudar.">
            <Text style={styles.sectionLabel}>Estilo alimentar</Text>
            <View style={styles.pillRow}>
              {DIET_OPTIONS.map((diet) => (
                <Chip
                  key={diet}
                  label={diet}
                  selected={dietTags.includes(diet)}
                  onPress={() => toggleSelection(diet, setDietTags)}
                />
              ))}
            </View>

            <Text style={styles.sectionLabel}>Alergias / restrições</Text>
            <TextInput
              style={[styles.textArea, { marginBottom: 8 }]}
              value={allergyNotes}
              onChangeText={setAllergyNotes}
              placeholder="Ex.: lactose severa; evitar camarão"
            />

            <Text style={styles.sectionLabel}>Observações adicionais</Text>
            <TextInput
              style={styles.textArea}
              value={contextNotes}
              onChangeText={setContextNotes}
              placeholder="Preferências, eventos, convidados..."
              multiline
            />
          </Section>

          <Section title="Macros, metas e orçamento" description="Os valores alimentam o prompt automaticamente.">
            <View style={styles.inputsRow}>
              <LabeledInput label="Porções" value={servings} onChangeText={setServings} keyboardType="numeric" style={{ flex: 1 }} />
              <LabeledInput label="Orçamento semanal (R$)" value={budget} onChangeText={setBudget} keyboardType="numeric" style={{ flex: 1.2 }} />
              <LabeledInput label="Tempo por refeição (min)" value={timePerMeal} onChangeText={setTimePerMeal} keyboardType="numeric" style={{ flex: 1.2 }} />
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 10 }]}>Meta de macros</Text>
            <View style={styles.inputsRow}>
              <LabeledInput label="Kcal" value={macroTarget.kcal} onChangeText={(v) => handleMacroChange("kcal", v)} keyboardType="numeric" />
              <LabeledInput label="Proteína (g)" value={macroTarget.protein} onChangeText={(v) => handleMacroChange("protein", v)} keyboardType="numeric" />
            </View>
            <View style={styles.inputsRow}>
              <LabeledInput label="Carbo (g)" value={macroTarget.carbs} onChangeText={(v) => handleMacroChange("carbs", v)} keyboardType="numeric" />
              <LabeledInput label="Gordura (g)" value={macroTarget.fat} onChangeText={(v) => handleMacroChange("fat", v)} keyboardType="numeric" />
            </View>

            <Text style={styles.sectionLabel}>Objetivo da semana</Text>
            <TextInput
              style={styles.textArea}
              value={goal}
              onChangeText={setGoal}
              placeholder="Ex.: Montar marmitas para treino matinal"
            />
          </Section>

          <Section title="Equipamentos e culinárias" description="Ajuda o bot a respeitar estrutura da cozinha.">
            <Text style={styles.sectionLabel}>Equipamentos disponíveis</Text>
            <View style={styles.pillRow}>
              {EQUIPMENT_OPTIONS.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={selectedEquipment.includes(item)}
                  onPress={() => toggleSelection(item, setSelectedEquipment)}
                />
              ))}
            </View>

            <Text style={styles.sectionLabel}>Culinárias desejadas</Text>
            <View style={styles.pillRow}>
              {CUISINE_OPTIONS.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={selectedOrigins.includes(item)}
                  onPress={() => toggleSelection(item, setSelectedOrigins)}
                />
              ))}
            </View>

            <Text style={styles.sectionLabel}>Itens que quero priorizar</Text>
            <View style={styles.pillRow}>
              {PRIORITY_OPTIONS.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={prioritized.includes(item)}
                  onPress={() => toggleSelection(item, setPrioritized)}
                />
              ))}
            </View>
          </Section>

          <Section title="Atalhos de pedido" description="Clique para preencher a mensagem automaticamente.">
            <View style={styles.quickPromptRow}>
              {QUICK_PROMPTS.map((item) => (
                <TouchableOpacity key={item.id} style={styles.quickPrompt} onPress={() => handleQuickPrompt(item.prompt)}>
                  <Ionicons name="flash-outline" size={14} color={colors.primary} />
                  <Text style={styles.quickPromptText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Section>
        </ScrollView>
      </View>
    ),
    [
      selectedRange,
      selectedMeals,
      dietTags,
      allergyNotes,
      contextNotes,
      servings,
      budget,
      timePerMeal,
      macroTarget,
      goal,
      selectedEquipment,
      selectedOrigins,
      prioritized,
      lastMenuChip,
      expiringItems,
      pantryItems,
      editablePantryText,
      handleQuickPrompt,
    ]
  );

  const renderItem = useCallback(
    ({ item }) => {
      if (item.isTyping) return <TypingRow />;
      if (item.menuChip)
        return (
          <MenuRow
            menuChip={item.menuChip}
            onSaveMenu={handleSaveMenu}
            isSaved={savedMenuIds.has(item.menuChip.id)}
            saving={savingMenuId === item.menuChip.id}
          />
        );
      return <MessageRow item={item} onGeneratePdf={handleGeneratePdf} />;
    },
    [handleSaveMenu, savedMenuIds, savingMenuId, handleGeneratePdf]
  );

  const handleMacroChange = (field, value) => setMacroTarget((prev) => ({ ...prev, [field]: value }));

  const finishWithParsedMenu = async (parsed, { defaultText, userText, isFallback } = {}) => {
    const baseId = Date.now();
    const talkText = parsed?.cleanText?.trim() || defaultText || (parsed?.menuChip ? "Cardápio pronto! Veja o resumo abaixo." : "Tudo certo!");
    const baseMsg = { id: String(baseId), role: "bot", text: talkText };

    let menuChipToUse = parsed?.menuChip;
    let manualNotes = [];
    if (userText && menuChipToUse) {
      const adjusted = applyUserOverrides(menuChipToUse, userText, { force: isFallback });
      menuChipToUse = adjusted.menuChip;
      manualNotes = adjusted.notes;
    }

    if (menuChipToUse) {
      const menuId = menuChipToUse.id || `menu-${baseId}`;
      const enrichedChip = {
        ...menuChipToUse,
        id: menuId,
        generatedAt: new Date().toISOString(),
      };
      setLastMenuChip(enrichedChip);

      const menuMsg = { id: String(baseId + 1), role: "bot", menuChip: enrichedChip };
      const extraMsgs = [];
      let msgIdCursor = baseId + 2;

      if (manualNotes.length) {
        extraMsgs.push({
          id: String(msgIdCursor++),
          role: "bot",
          text: `Ajustes aplicados: ${manualNotes.join("; ")}`,
        });
      }

      // Adicionar mensagem com botão para gerar PDF
      extraMsgs.push({
        id: String(msgIdCursor++),
        role: "bot",
        text: "Cardápio gerado com sucesso! 🎉",
        showPdfButton: true,
        menuChipForPdf: enrichedChip,
      });

      setMessages((prev) => prev.filter((m) => m.id !== "typing").concat(baseMsg, menuMsg, ...extraMsgs));
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== "typing").concat(baseMsg));
    }

    scrollToEnd();
  };

  function scrollToEnd() {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }

  return (
    <SafeScreen edges={["top", "bottom"]}>
      <View style={styles.screen}>
        {/* Caixa de Personalização */}
        <View style={styles.manualToggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.customizationHeaderText}>Contexto personalizado</Text>
            <Text style={styles.customizationHelper}>
              Ative para editar manualmente o contexto enviado ao Gemini.
            </Text>
          </View>
          <Switch
            value={useManualContext}
            onValueChange={setUseManualContext}
            trackColor={{ false: "#d4d4d8", true: colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {useManualContext && renderManualContext()}

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0}
        >
          <View style={styles.flex}>
            <FlatList
              ref={listRef}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: 20,
                paddingBottom: 180 + (showEmoji ? 220 : 0),
              }}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              initialNumToRender={10}
              maxToRenderPerBatch={8}
              windowSize={6}
              removeClippedSubviews
              onContentSizeChange={scrollToEnd}
            />

            {showEmoji && (
              <View style={styles.emojiPanel}>
                <Text style={styles.emojiTitle}>Emojis</Text>
                <View style={styles.emojiGrid}>
                  {EMOJIS.map((e) => (
                    <TouchableOpacity
                      key={e}
                      style={styles.emojiBtn}
                      onPress={() => {
                        setText((prev) => prev + e);
                        inputRef.current?.focus?.();
                      }}
                    >
                      <Text style={styles.emojiText}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.inputBar}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => {
                  setShowEmoji((v) => {
                    const next = !v;
                    if (next) Keyboard.dismiss();
                    else inputRef.current?.focus?.();
                    return next;
                  });
                }}
              >
                <Text style={{ fontSize: 20 }}>😊</Text>
              </TouchableOpacity>

              <TextInput
                ref={inputRef}
                style={styles.textInput}
                value={text}
                onChangeText={setText}
                placeholder="Escreva seu pedido ou use um atalho"
                placeholderTextColor="#999"
                editable={!loading}
                onFocus={() => setShowEmoji(false)}
                onSubmitEditing={canSend ? handleSend : undefined}
                returnKeyType="send"
              />

              {loading ? (
                <View style={[styles.goBtn, styles.goDisabled]}>
                  <ActivityIndicator />
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.goBtn, !canSend && styles.goDisabled]}
                  disabled={!canSend}
                  onPress={handleSend}
                >
                  <Text style={styles.goText}>Enviar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>

        <FooterNav active="CardapioBotScreen" onNavigate={navigation?.replace} />
      </View>
    </SafeScreen>
  );
}

function toggleSelection(value, setter) {
  setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
}

const TypingRow = React.memo(() => (
  <View style={[styles.row, styles.left]}>
    <View style={[styles.bubble, styles.botBubble]}>
      <TypingDots />
    </View>
  </View>
));
TypingRow.displayName = "TypingRow";

const MenuRow = React.memo(({ menuChip, onSaveMenu, isSaved, saving }) => (
  <View style={[styles.row, styles.left]}>
    <MenuPreview
      menuChip={menuChip}
      onSaveMenu={onSaveMenu}
      isSaved={isSaved}
      isSaving={saving}
    />
  </View>
));
MenuRow.displayName = "MenuRow";

const MessageRow = React.memo(({ item, onGeneratePdf }) => {
  const showButton = !!item.showPdfButton;
  const isGenerating = !!item.generatingPdf;

  return (
    <View style={[styles.row, item.role === "user" ? styles.right : styles.left]}>
      <View
        style={[
          styles.bubble,
          item.role === "user" ? styles.userBubble : styles.botBubble,
          item.error && { borderColor: "#c00", borderWidth: 1 },
        ]}
      >
        {item.role === "bot" && <Text style={styles.botName}>CardapioBot</Text>}
        {!!item.text && <Text style={styles.msgText}>{item.text}</Text>}

        {showButton && (
          <TouchableOpacity
            style={styles.pdfGenerateButton}
            onPress={() => onGeneratePdf?.(item.menuChipForPdf, item.id)}
            disabled={isGenerating}
            activeOpacity={0.8}
          >
            {isGenerating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={styles.pdfGenerateButtonText}>Baixar cardápio em PDF</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});
MessageRow.displayName = "MessageRow";

function TypingDots() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", height: 18 }}>
      <View style={styles.dot} />
      <View style={[styles.dot, { opacity: 0.6 }]} />
      <View style={[styles.dot, { opacity: 0.3 }]} />
    </View>
  );
}

function LabeledInput({ label, style, ...props }) {
  return (
    <View style={[styles.inputGroup, style]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput {...props} style={styles.inputBox} placeholderTextColor="#9CA3AF" />
    </View>
  );
}

function Section({ title, description, children }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {description && <Text style={styles.sectionDescription}>{description}</Text>}
      {children}
    </View>
  );
}

function InfoBadge({ label, value, variant = "default", compact = false }) {
  return (
    <View style={[styles.infoBadge, variant === "warning" && styles.infoBadgeWarning, compact && { flex: 0 }]}>
      <Text style={styles.badgeLabel}>{label}</Text>
      <Text style={styles.badgeValue}>{value}</Text>
    </View>
  );
}

function Chip({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function extractMenuDays(data) {
  if (!data) return [];
  if (Array.isArray(data?.dias)) return data.dias;
  if (Array.isArray(data?.menu?.dias)) return data.menu.dias;
  return [];
}

function MenuPreview({ menuChip, onSaveMenu, isSaved, isSaving }) {
  const days = extractMenuDays(menuChip.data);
  const shopping = Array.isArray(menuChip.data?.shoppingList) ? menuChip.data.shoppingList : [];
  const assumptions = Array.isArray(menuChip.data?.assumptions) ? menuChip.data.assumptions : [];
  const constraints = menuChip.data?.constraints || {};

  return (
    <View style={styles.menuCard}>
      <Text style={styles.menuTitle}>{menuChip.title}</Text>
      {menuChip.dateRange && <Text style={styles.menuSubtitle}>{menuChip.dateRange}</Text>}

      <View style={styles.menuConstraintRow}>
        {(constraints.diet || []).map((item) => (
          <Text key={item} style={styles.menuConstraintChip}>{item}</Text>
        ))}
        {constraints.timePerMealMinutes && (
          <Text style={styles.menuConstraintChip}>{constraints.timePerMealMinutes} min/ref.</Text>
        )}
        {constraints.budget?.max && (
          <Text style={styles.menuConstraintChip}>R$ {constraints.budget.max}/{constraints.budget.period === "daily" ? "dia" : "semana"}</Text>
        )}
      </View>

      {days.map((day) => (
        <View key={day.dia} style={styles.menuDay}>
          <Text style={styles.menuDayTitle}>{day.dia}</Text>
          {(day.refeicoes || []).map((meal) => (
            <View key={`${day.dia}-${meal.nome}`} style={styles.menuMeal}>
              <Text style={styles.menuMealTitle}>{meal.nome}</Text>
              <Text style={styles.menuMealText}>{(meal.itens || []).join(" • ")}</Text>
            </View>
          ))}
        </View>
      ))}

      {shopping.length > 0 && (
        <View style={styles.shoppingBlock}>
          <Text style={styles.menuSectionLabel}>Lista de compras</Text>
          {shopping.map((group) => (
            <View key={group.categoria} style={styles.shoppingRow}>
              <Text style={styles.shoppingCategory}>{group.categoria}</Text>
              <Text style={styles.shoppingItems}>
                {(group.itens || []).map((item) => item.nome).join(", ")}
              </Text>
            </View>
          ))}
        </View>
      )}

      {assumptions.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.menuSectionLabel}>Assunções</Text>
          {assumptions.map((item, idx) => (
            <Text key={idx} style={styles.assumptionText}>• {item}</Text>
          ))}
        </View>
      )}

      <View style={styles.menuActions}>
        <TouchableOpacity
          style={[
            styles.saveMenuBtn,
            (isSaved || isSaving) && styles.saveMenuBtnDisabled,
            isSaved && styles.saveMenuBtnSaved,
          ]}
          onPress={() => onSaveMenu?.(menuChip)}
          disabled={isSaved || isSaving}
          activeOpacity={0.9}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons
                name={isSaved ? "checkmark-circle" : "bookmark-outline"}
                size={18}
                color={isSaved ? colors.primary : "#fff"}
                style={styles.saveMenuIcon}
              />
              <Text style={[styles.saveMenuText, isSaved && styles.saveMenuTextSaved]}>
                {isSaved ? "Cardápio salvo" : "Salvar no perfil"}
              </Text>
            </>
          )}
        </TouchableOpacity>
        {isSaved && <Text style={styles.saveMenuHint}>Perfil › Cardápios</Text>}
      </View>

    </View>
  );
}

function buildPrompt(userText, ctx = {}) {
  return `
Você é o **CardapioBot**, um assistente culinário em pt-BR para planejamento de refeições.
Fale sempre português do Brasil, direto e educado. Use medidas do Brasil (g, ml, xíc. = 240 ml, col. sopa = 15 ml, col. chá = 5 ml). Preços em BRL (R$). Números com vírgula decimal.

## Objetivo
Interpretar o pedido do usuário e:
- **Conversar brevemente** quando for bate-papo.
- **Responder sobre estoque** quando perguntarem "o que tenho?", "quais itens vencem logo?", "quantas unidades restam?", usando os dados de ctx.pantrySnapshot e ctx.expiringSoon.
- **Gerar cardápio** quando solicitado (semanal/diário/um período específico), **respeitando** preferências, restrições, alergias, orçamento, tempo, equipamentos, e itens disponíveis na despensa.

## Estoque e interações sem cardápio
- Se a intenção for apenas consultar ou manipular o estoque, responda com um texto claro, cite os itens relevantes e indique prioridades (ex.: "Peito de frango - 1,2 kg (Freezer)").
- Destaque itens próximos de vencer e sugira como usá-los, sem criar <MENU>.
- Observe ctx.contextMode: "auto_stock" significa que só o estoque deve ser levado em conta; "manual_form" indica que o usuário abriu a personalização escrita e quer aqueles ajustes considerados.

## Regras de planejamento
- Se faltarem detalhes críticos (ex.: alergia declarada mas sem lista), **assuma padrões seguros** e liste hipóteses em \`assumptions\`.
- Dê preferência a ingredientes sazonais no Brasil e a preparos simples quando houver restrição de tempo/equipamentos.
- Se o usuário informar **itens disponíveis (despensa/geladeira)**, **priorize usá-los**.
- Permita **substituições** (vegano/vegetariano/halal/kosher/sem lactose/sem glúten/low-FODMAP/diabetes/hipertensão/keto/low-carb/high-protein, etc.).
- Evite ingredientes proibidos e **garanta ausência total** dos alergênicos indicados.
- **CRÍTICO: Nunca** entregue um cardápio parcial:
  * Se o pedido for "Semana completa (7 dias)", você DEVE gerar EXATAMENTE 7 dias (Segunda a Domingo).
  * Se o período solicitado cobrir N dias, preencha \`menu.dias\` com TODOS os N dias do intervalo.
  * NUNCA pare antes de completar todos os dias - mesmo que o limite de tokens esteja próximo, priorize completar o cardápio.
  * Se não for possível gerar o período completo, explique ao usuário e peça dados extras em vez de entregar algo incompleto.
- Quando o usuário pedir **alterações específicas** (ex.: "trocar o café da manhã por pão de batata" ou "remover camarão do jantar"), utilize o histórico recente em \`ctx.conversationHistory\` para entender o contexto e **aplique as mudanças em todo o cardápio**. Repita essas mudanças no texto e no JSON, confirmando explicitamente o que foi ajustado.
- Opcionalmente, faça *batch cooking* (adiantando preparos para a semana) quando fizer sentido.
- Nutrição: quando pedido, informe **kcal** e **macros** (carbs_g, protein_g, fat_g) por refeição e por dia (estimativas).

## Quando gerar cardápio (pedido explícito ou implícito):
Só gere <MENU> quando o usuário pedir explicitamente (ou concordar claramente) com a criação de um cardápio/plano de refeições.
1) Dê uma resposta curta explicando o racional.
2) Em seguida, **obrigatoriamente** inclua **um único** bloco \`<MENU>{...}</MENU>\` contendo **JSON válido** (sem comentários, sem \`undefined\`, sem vírgulas sobrando, sem markdown dentro). Use **aspas duplas** nas chaves/valores.

## Esquema do JSON dentro de <MENU>…</MENU>
{
  "type": "menu_chip",
  "title": string,
  "dateRange": string|null,
  "servings": integer|null,
  "constraints": {
    "diet": [string],
    "exclusions": [string],
    "budget": { "currency":"BRL","period":"weekly|daily","max": number|null },
    "timePerMealMinutes": number|null,
    "equipment": [string],
    "origins": [string]
  },
  "assumptions": [string],
  "menu": {
    "dias": [
      {
        "dia": "Segunda-feira",
        "refeicoes": [
          {
            "nome": "Café da manhã",
            "itens": [string],
            "kcal": number|null,
            "macros": { "carbs_g":number|null, "protein_g":number|null, "fat_g":number|null },
            "prep": [string],
            "observacoes": string|null
          }
        ]
      }
    ]
  },
  "shoppingList": [
    {
      "categoria": "Hortifruti",
      "itens": [
        { "nome":"Banana", "quantidade":"10 un", "observacao":"" }
      ]
    }
  ],
  "prepBatching": [
    { "dia": "Domingo", "tarefas": ["Cozinhar 1 kg de feijão e porcionar"] }
  ],
  "substitutions": [
    { "original":"Leite", "alternativas":["Leite sem lactose","Bebida vegetal (aveia)"] }
  ],
  "costEstimate": {
    "currency": "BRL",
    "total": number|null,
    "porDia": number|null,
    "assumptions": [string]
  }
}

## Formatação da resposta
- Mensagem normal: **curta**, clara e em pt-BR.
- Depois, **apenas um** bloco \`<MENU>{…}</MENU>\` quando houver cardápio.
- **Nunca** inclua markdown, crases, comentários ou texto extra **dentro** do JSON.
- **Nunca** use valores \`NaN\` ou \`undefined\` no JSON.

## Contexto opcional vindo do app (JSON livre)
${JSON.stringify(ctx || {}, null, 2)}

## Mensagem do usuário
"""${userText}"""
`;
}

function parseMenuChip(raw) {
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
  } catch {}
  return { cleanText: raw.trim() };
}

function shouldUseDemoCardapio(error) {
  if (!API_KEY) return true;
  if (!error) return false;
  const msg = String(error.message || "").toLowerCase();
  return (
    msg.includes("resposta vazia") ||
    msg.includes("failed to fetch") ||
    msg.includes("network request failed") ||
    msg.includes("gemini http 4") ||
    msg.includes("gemini http 5")
  );
}

function applyUserOverrides(menuChip, userText, { force = false } = {}) {
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

function extractMealReplacement(text, triggers) {
  const escaped = triggers.map(escapeRegExp).join("|");
  const patterns = [
    `(?:troque|substitua|mude|altere)\s+(?:o|a)?\s*(?:${escaped})[^.\n]*?(?:por|para|com)\s+([^.,;\n]+)` ,
    `(?:${escaped})[^.\n]*?(?:por|para|com|:)\s+([^.,;\n]+)` ,
  ];

  for (const pattern of patterns) {
    const regex = new RegExp(pattern, "i");
    const match = text.match(regex);
    if (match && match[1]) return match[1].trim();
  }
  return null;
}

function replaceMeals(data, replacements, { force = false } = {}) {
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

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMenuHtml(title, range, menuData) {
  const dias = extractMenuDays(menuData);

  const cards = dias
    .map((d) => {
      const refeicoes = Array.isArray(d.refeicoes) ? d.refeicoes : [];
      const blocos = refeicoes
        .map((r) => {
          const itens = Array.isArray(r.itens) ? r.itens : [];
          const li = itens.map((x) => `<li>${escapeHtml(String(x))}</li>`).join("");
          return `
            <div class="meal">
              <div class="meal-title">${escapeHtml(String(r.nome || ""))}</div>
              <ul>${li}</ul>
            </div>`;
        })
        .join("");

      return `
        <section class="day-card">
          <header class="day-header">
            <span class="day-label">${escapeHtml(String(d.dia || ""))}</span>
          </header>
          <div class="meals">${blocos}</div>
        </section>`;
    })
    .join("");

  return `
    <!doctype html>
    <html lang="pt-br">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>${escapeHtml(title)}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 18mm;
        }
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, Roboto, "Segoe UI", Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #1f2937;
          background: #f9fafb;
        }
        main { padding: 0 18mm 18mm; }
        h1 { margin: 0 0 4px 0; font-size: 24px; color: #064e3b; }
        .range { color: #4b5563; margin-bottom: 20px; font-size: 14px; }
        .day-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12mm;
        }
        .day-card {
          background: #fff;
          border-radius: 16px;
          padding: 14px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .day-header {
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 12px;
          padding-bottom: 8px;
        }
        .day-label { font-weight: 700; color: #065f46; font-size: 15px; text-transform: uppercase; }
        .meal { margin-bottom: 12px; }
        .meal:last-child { margin-bottom: 0; }
        .meal-title { font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #111827; }
        ul {
          margin: 0;
          padding-left: 18px;
        }
        li { line-height: 1.4; font-size: 13px; margin-bottom: 2px; }
        .footer { margin-top: 24px; font-size: 12px; color: #6b7280; text-align: center; }
      </style>
    </head>
    <body>
      <main>
        <h1>${escapeHtml(title)}</h1>
        ${range ? `<div class="range">${escapeHtml(range)}</div>` : ""}
        <div class="day-grid">${cards}</div>
        <div class="footer">Gerado automaticamente pelo CardapioBot.</div>
      </main>
    </body>
    </html>
  `;
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  manualToggleRow: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 16,
  },
  customizationHeaderText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  customizationHelper: { fontSize: 13, color: colors.mutedText, marginTop: 4 },
  manualContextWrapper: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    maxHeight: 480,
    overflow: "hidden",
  },
  manualContextScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 18,
  },

  heroCard: {
    backgroundColor: colors.primary50,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    gap: 12,
  },
  heroEyebrow: { textTransform: "uppercase", fontSize: 12, color: colors.primary, fontWeight: "700" },
  heroTitle: { fontSize: 20, fontWeight: "700", color: colors.text, marginTop: 4 },
  heroSubtitle: { color: colors.mutedText, marginTop: 6, lineHeight: 18 },

  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    gap: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  sectionDescription: { fontSize: 13, color: colors.mutedText },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: colors.mutedText, marginBottom: 6 },

  badgeRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  infoBadge: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoBadgeWarning: { backgroundColor: "#FEF3C7", borderColor: "#FCD34D" },
  badgeLabel: { fontSize: 12, color: colors.mutedText, textTransform: "uppercase", letterSpacing: 0.5 },
  badgeValue: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 4 },

  expiringRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  expiringName: { fontSize: 14, color: colors.text },
  expiringTag: { fontSize: 13, color: "#B45309", fontWeight: "600" },

  pantryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pantryPill: {
    width: "48%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#F3F4F6",
  },
  pantryName: { fontWeight: "600", color: colors.text },
  pantryMeta: { fontSize: 12, color: colors.mutedText, marginTop: 4 },
  pantryEditor: { minHeight: 110, textAlignVertical: "top" },
  helperText: { fontSize: 12, color: colors.mutedText, marginTop: 8, marginBottom: 12 },

  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: colors.primary50, borderColor: colors.primary },
  chipText: { color: colors.mutedText, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: colors.primary },

  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
    color: colors.text,
    minHeight: 48,
  },

  inputsRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  inputGroup: { flex: 1, minWidth: 120 },
  inputLabel: { fontSize: 12, color: colors.mutedText, marginBottom: 4 },
  inputBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#fff",
    color: colors.text,
  },

  quickPromptRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickPrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#ECFDF5",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  quickPromptText: { color: "#047857", fontWeight: "600", fontSize: 13 },

  lastMenuTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  lastMenuRange: { fontSize: 13, color: colors.mutedText, marginTop: 2 },
  lastMenuStamp: { fontSize: 12, color: colors.mutedText, marginTop: 6 },

  row: { width: "100%", marginBottom: 12, flexDirection: "row" },
  left: { justifyContent: "flex-start" },
  right: { justifyContent: "flex-end" },

  bubble: {
    maxWidth: "85%",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  botBubble: { backgroundColor: "#f4f6f8" },
  userBubble: { backgroundColor: "#e8f5e9" },

  botName: { color: "#2e7d32", fontWeight: "700", marginBottom: 6 },
  msgText: { fontSize: 15, lineHeight: 20, color: "#222" },
  dot: { width: 6, height: 6, marginRight: 4, borderRadius: 3, backgroundColor: "#999" },

  inputBar: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#eee",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingBottom: 12,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  textInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 10,
    fontSize: 15,
    backgroundColor: "#fff",
    color: colors.text,
  },
  goBtn: {
    paddingHorizontal: 18,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  goDisabled: { backgroundColor: "#bdbdbd" },
  goText: { color: "#fff", fontWeight: "700" },

  emojiPanel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#eee",
    backgroundColor: "#fafafa",
    paddingHorizontal: 8,
    paddingTop: 10,
    height: 220,
  },
  emojiTitle: { fontWeight: "700", marginLeft: 4, marginBottom: 6, color: "#333" },
  emojiGrid: { flexDirection: "row", flexWrap: "wrap" },
  emojiBtn: { width: "12.5%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  emojiText: { fontSize: 26 },

  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    width: "100%",
  },
  menuTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  menuSubtitle: { fontSize: 13, color: colors.mutedText },
  menuConstraintRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  menuConstraintChip: {
    backgroundColor: colors.primary50,
    color: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "600",
  },
  menuDay: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 10,
  },
  menuDayTitle: { fontWeight: "700", color: colors.text, marginBottom: 6 },
  menuMeal: { marginBottom: 6 },
  menuMealTitle: { fontSize: 13, fontWeight: "600", color: colors.text },
  menuMealText: { fontSize: 12, color: colors.mutedText, marginTop: 2 },
  shoppingBlock: { marginTop: 4 },
  menuSectionLabel: { fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: 6 },
  shoppingRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  shoppingCategory: { fontSize: 13, fontWeight: "600", color: colors.text },
  shoppingItems: { fontSize: 12, color: colors.mutedText, flex: 1, textAlign: "right", marginLeft: 10 },
  assumptionText: { fontSize: 12, color: colors.mutedText, marginTop: 4 },
  menuActions: { marginTop: 8 },
  saveMenuBtn: {
    marginTop: 4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  saveMenuBtnDisabled: { opacity: 0.9 },
  saveMenuBtnSaved: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  saveMenuIcon: { marginRight: 6 },
  saveMenuText: { color: "#fff", fontWeight: "700" },
  saveMenuTextSaved: { color: colors.primary },
  saveMenuHint: { marginTop: 6, fontSize: 11, color: colors.mutedText, textAlign: "center" },
  pdfGenerateButton: {
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pdfGenerateButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
