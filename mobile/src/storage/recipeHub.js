import { Platform } from "react-native";

const POSTS_KEY = "@kitchen_brain_hub_posts";
const REACTIONS_KEY = "@kitchen_brain_hub_reactions";

let asyncStorageInstance = null;
function getStorage() {
  if (Platform.OS === "web") return webStorage;
  if (!asyncStorageInstance) {
    asyncStorageInstance = require("@react-native-async-storage/async-storage").default;
  }
  return asyncStorageInstance;
}

const defaultReactions = {
  likedIds: [],
  savedIds: [],
  ratings: {},
};

export async function getCommunityPosts() {
  const storage = getStorage();
  try {
    const raw = await storage.getItem(POSTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.warn("Erro ao carregar posts do hub", err);
    return [];
  }
}

export async function addCommunityPost(post) {
  if (!post) return getCommunityPosts();
  const storage = getStorage();
  const mediaType = post.mediaType || (post.videoUri ? "video" : "image");
  const mediaUri = post.mediaUri || post.videoUri || post.image || null;

  const normalized = {
    id: post.id || `user-post-${Date.now()}`,
    title: post.title?.trim() || "Receita sem título",
    description: post.description?.trim() || "",
    ingredients: post.ingredients || [],
    steps: post.steps || [],
    tags: post.tags || [],
    difficulty: post.difficulty || "Fácil",
    prepTime: post.prepTime || "",
    image: post.image || (mediaType === "image" ? mediaUri : null),
    mediaType,
    mediaUri,
    videoUri: post.videoUri || (mediaType === "video" ? mediaUri : null),
    author: post.author || {
      name: "Você",
      handle: "@voce",
      avatar: null,
    },
    likes: post.likes || 0,
    comments: post.comments || 0,
    saves: post.saves || 0,
    rating: post.rating || 0,
    createdAt: post.createdAt || new Date().toISOString(),
    type: "community",
  };

  const current = await getCommunityPosts();
  const next = [normalized, ...current];
  await storage.setItem(POSTS_KEY, JSON.stringify(next));
  return next;
}

export async function getHubReactions() {
  const storage = getStorage();
  try {
    const raw = await storage.getItem(REACTIONS_KEY);
    if (!raw) return { ...defaultReactions };
    const parsed = JSON.parse(raw);
    return {
      likedIds: parsed?.likedIds || [],
      savedIds: parsed?.savedIds || [],
      ratings: parsed?.ratings || {},
    };
  } catch (err) {
    console.warn("Erro ao carregar reações do hub", err);
    return { ...defaultReactions };
  }
}

export async function toggleSave(postId) {
  if (!postId) return getHubReactions();
  const storage = getStorage();
  const current = await getHubReactions();
  const savedIds = new Set(current.savedIds);
  if (savedIds.has(postId)) {
    savedIds.delete(postId);
  } else {
    savedIds.add(postId);
  }
  const next = { ...current, savedIds: Array.from(savedIds) };
  await storage.setItem(REACTIONS_KEY, JSON.stringify(next));
  return next;
}

export async function toggleLike(postId) {
  if (!postId) return getHubReactions();
  const storage = getStorage();
  const current = await getHubReactions();
  const likedIds = new Set(current.likedIds);
  if (likedIds.has(postId)) {
    likedIds.delete(postId);
  } else {
    likedIds.add(postId);
  }
  const next = { ...current, likedIds: Array.from(likedIds) };
  await storage.setItem(REACTIONS_KEY, JSON.stringify(next));
  return next;
}

export async function setRating(postId, value) {
  if (!postId) return getHubReactions();
  const storage = getStorage();
  const current = await getHubReactions();
  const ratings = {
    ...current.ratings,
    [postId]: value,
  };
  const next = { ...current, ratings };
  await storage.setItem(REACTIONS_KEY, JSON.stringify(next));
  return next;
}

export async function resetHubStorage() {
  const storage = getStorage();
  await Promise.all([storage.removeItem(POSTS_KEY), storage.removeItem(REACTIONS_KEY)]);
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
