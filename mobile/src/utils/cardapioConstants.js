// Constantes, opções de formulário e payload de demonstração do CardapioBot.
import { getLocalStockItems } from "../data/stock";

export const EMOJIS = ["😀","😁","😂","😊","😍","😋","😎","🤔","🙌","👍","👎","🥗","🍲","🍛","🍳","🥪","🍎","🥦","🧀","🥖","🍗"];

export const STARTER_BOT_MSG = {
  id: "m0",
  role: "bot",
  text:
    "Bom dia! Sou seu assistente de geração de cardápios! Inicie uma conversa comigo para que eu possa te auxiliar a montar o melhor cardápio possível para você!",
};

export const PROFILE_SNAPSHOT = {
  name: "Thaís Paiva",
  dietaryStyle: ["Flexitariana", "Sem lactose"],
  allergies: ["Lactose", "Camarão"],
  goals: ["Marmitas equilibradas", "Reduzir ultraprocessados"],
  macros: { kcal: 1800, protein: 110, carbs: 180, fat: 60 },
};

export const SAMPLE_PANTRY_PLACEHOLDER = getLocalStockItems().slice(0, 2);

export const QUICK_PROMPTS = [
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

export const RANGE_OPTIONS = [
  "Semana completa (7 dias)",
  "Seg. a Sex.",
  "Só fim de semana",
  "Período personalizado",
];

export const MEAL_OPTIONS = ["Café da manhã", "Almoço", "Jantar", "Lanches", "Ceia leve"];
export const DIET_OPTIONS = ["Flexitariana", "Vegetariana", "Low-carb", "Rica em proteínas", "Sem lactose", "Anti-inflamatória"];
export const EQUIPMENT_OPTIONS = ["Fogão", "Air fryer", "Forno", "Micro-ondas", "Panela de pressão", "Liquidificador"];
export const CUISINE_OPTIONS = ["Brasileira caseira", "Mediterrânea", "Italiana leve", "Asiática", "Comfort food"];
export const PRIORITY_OPTIONS = ["Peito de frango", "Abóbora cabotiá", "Espinafre", "Grão-de-bico", "Quinoa", "Queijos duros"];

export const MOCK_MENU_PAYLOAD = {
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

export const MOCK_MENU_RESPONSE = `<MENU>${JSON.stringify(MOCK_MENU_PAYLOAD)}</MENU>`;
