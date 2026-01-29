export const HUB_CREATORS = [
  {
    id: "chef-livia",
    name: "Chef Lívia M.",
    handle: "@livia.mag",
    avatar: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=240&q=60",
    badge: "Chef Pro",
  },
  {
    id: "chef-renato",
    name: "Renato Sampaio",
    handle: "@renatinhocwb",
    avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=240&q=60",
    badge: "Panificador",
  },
  {
    id: "chef-isa",
    name: "Isa Nakahara",
    handle: "@isalab",
    avatar: "https://images.unsplash.com/photo-1544723795-432537f7794d?auto=format&fit=crop&w=240&q=60",
    badge: "Veggie lover",
  },
];

export const HUB_POSTS = [
  {
    id: "hub-tiramisu-matcha",
    title: "Tiramisù de matcha com toque cítrico",
    description:
      "Um tiramisù leve com camadas de biscoito champagne embebido em calda de yuzu e creme mascarpone batido com matcha cerimonial. Finalizo com raspas de chocolate branco e pistache crocante.",
    image: "https://images.unsplash.com/photo-1488900128323-21503983a07e?auto=format&fit=crop&w=900&q=60",
    mediaType: "image",
    mediaUri: "https://images.unsplash.com/photo-1488900128323-21503983a07e?auto=format&fit=crop&w=900&q=60",
    author: HUB_CREATORS[0],
    likes: 238,
    comments: 42,
    saves: 81,
    rating: 4.9,
    tags: ["Doce autoral", "Matcha", "Sem forno"],
    difficulty: "Intermediário",
    prepTime: "40 min",
    createdAt: "2024-06-20T09:00:00.000Z",
  },
  {
    id: "hub-focaccia-uva",
    title: "Focaccia de fermentação lenta com uva e alecrim",
    description:
      "Hidratei 85% da farinha com fermento natural e deixei fermentar por 24h. Antes de assar, pressiono uvas rubi, sal Maldon e muito azeite. Crocante por fora e macia por dentro!",
    image: "https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=900&q=60",
    mediaType: "image",
    mediaUri: "https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=900&q=60",
    author: HUB_CREATORS[1],
    likes: 410,
    comments: 96,
    saves: 190,
    rating: 4.8,
    tags: ["Pão", "Fermento natural", "Vegano"],
    difficulty: "Avançado",
    prepTime: "24h",
    createdAt: "2024-06-18T18:30:00.000Z",
  },
  {
    id: "hub-bowl-soba",
    title: "Soba integral com molho de missô, gengibre e manga",
    description:
      "Receita rapidinha: cozinho soba, cubro com molho frio de missô branco, limão tahiti e gengibre. Sirvo com manga, pepino, tofu selado e gergelim.",
    image: "https://images.unsplash.com/photo-1541401154946-62f8d84bd284?auto=format&fit=crop&w=900&q=60",
    mediaType: "image",
    mediaUri: "https://images.unsplash.com/photo-1541401154946-62f8d84bd284?auto=format&fit=crop&w=900&q=60",
    author: HUB_CREATORS[2],
    likes: 156,
    comments: 21,
    saves: 67,
    rating: 4.6,
    tags: ["Veggie", "15 min", "Refrescante"],
    difficulty: "Fácil",
    prepTime: "20 min",
    createdAt: "2024-06-17T12:10:00.000Z",
  },
];

export const HUB_TAGS = [
  { id: "all", label: "Tudo" },
  { id: "veg", label: "Veggie" },
  { id: "dessert", label: "Sobremesas" },
  { id: "baked", label: "Assados" },
  { id: "quick", label: "Até 30 min" },
];
