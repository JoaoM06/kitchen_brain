import React, { useMemo, useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SafeScreen from "../components/SafeScreen";
import FooterNav from "../components/FooterNav";
import IngredientAvailability from "../components/IngredientAvailability";
import { colors } from "../theme/colors";
import { RECIPES } from "../data/recipes";
import { getRecipe, checkRecipeAvailability, toggleFavorite } from "../api/recipes";

export default function RecipeDetailScreen({ route, navigation }) {
  const recipeId = route?.params?.recipeId;
  const isApiRecipe = route?.params?.isApiRecipe || false;

  const [recipe, setRecipe] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(isApiRecipe);
  const [isFavorite, setIsFavorite] = useState(false);
  const [token, setToken] = useState(null);

  // Fallback para dados locais
  const localRecipe = useMemo(() => RECIPES.find((r) => r.id === recipeId) || RECIPES[0], [recipeId]);

  useEffect(() => {
    loadToken();
  }, []);

  useEffect(() => {
    if (isApiRecipe && token) {
      loadRecipeFromApi();
    }
  }, [isApiRecipe, token, recipeId]);

  const loadToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      setToken(storedToken);
    } catch (err) {
      console.error("Erro ao carregar token:", err);
    }
  };

  const loadRecipeFromApi = async () => {
    try {
      setLoading(true);
      const data = await getRecipe(recipeId, token);
      setRecipe(data);
      setIsFavorite(data.is_favorita || false);

      // Carrega disponibilidade dos ingredientes
      const availData = await checkRecipeAvailability(recipeId, token);
      setAvailability(availData);
    } catch (err) {
      console.error("Erro ao carregar receita:", err);
      Alert.alert("Erro", "Não foi possível carregar a receita");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!token || !isApiRecipe) return;

    try {
      const result = await toggleFavorite(recipeId, token);
      setIsFavorite(result.is_favorita);
    } catch (err) {
      console.error("Erro ao favoritar:", err);
    }
  };

  const handleAddToShoppingList = useCallback((faltando) => {
    // TODO: Implementar integração com lista de compras
    Alert.alert(
      "Adicionar à lista",
      `${faltando.length} ingrediente(s) serão adicionados à sua lista de compras.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Adicionar", onPress: () => console.log("Adicionar:", faltando) }
      ]
    );
  }, []);

  const openVideo = async () => {
    const url = recipe?.videoUrl || localRecipe?.videoUrl;
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert("Vídeo", "Não consegui abrir o link do YouTube");
    }
  };

  // Usar dados da API ou locais
  const displayRecipe = isApiRecipe ? recipe : localRecipe;

  if (loading) {
    return (
      <SafeScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando receita...</Text>
        </View>
        <FooterNav active="Recipes" onNavigate={navigation.replace} />
      </SafeScreen>
    );
  }

  if (!displayRecipe) {
    return (
      <SafeScreen>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle" size={48} color="#999" />
          <Text style={styles.loadingText}>Receita não encontrada</Text>
          <TouchableOpacity style={styles.backBtnCenter} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnCenterText}>Voltar</Text>
          </TouchableOpacity>
        </View>
        <FooterNav active="Recipes" onNavigate={navigation.replace} />
      </SafeScreen>
    );
  }

  const title = displayRecipe.titulo || displayRecipe.title;
  const prepTime = displayRecipe.tempo_preparo_min
    ? `${displayRecipe.tempo_preparo_min} min`
    : displayRecipe.prepTime;
  const servings = displayRecipe.rendimento_porcoes || displayRecipe.servings;
  const difficulty = displayRecipe.dificuldade || displayRecipe.difficulty || "Médio";
  const ingredients = displayRecipe.ingredientes || displayRecipe.ingredients || [];
  const steps = displayRecipe.modo_preparo || displayRecipe.steps || [];
  const imageSource = displayRecipe.imagem_url
    ? { uri: displayRecipe.imagem_url }
    : displayRecipe.image;

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {imageSource ? (
            <Image source={imageSource} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Ionicons name="restaurant" size={64} color="#ccc" />
            </View>
          )}
          <View style={styles.heroOverlay} />

          {displayRecipe.videoUrl && (
            <TouchableOpacity style={styles.videoBtn} onPress={openVideo}>
              <Ionicons name="play" size={16} color="#fff" />
              <Text style={styles.videoBtnText}>Assistir vídeo</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
            <Text style={styles.backBtnText}>Voltar</Text>
          </TouchableOpacity>

          {isApiRecipe && token && (
            <TouchableOpacity style={styles.favoriteBtn} onPress={handleToggleFavorite}>
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={isFavorite ? "#FF3B30" : "#fff"}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            {displayRecipe.fonte && (
              <View style={styles.sourceTag}>
                <Text style={styles.sourceTagText}>{displayRecipe.fonte}</Text>
              </View>
            )}
          </View>

          {displayRecipe.descricao && (
            <Text style={styles.description}>{displayRecipe.descricao}</Text>
          )}

          <View style={styles.metaRow}>
            <MetaCard icon="time-outline" label="Tempo" value={prepTime} />
            <MetaCard icon="people-outline" label="Porções" value={`${servings}`} />
            <MetaCard icon="speedometer-outline" label="Dificuldade" value={difficulty} />
          </View>

          {/* Disponibilidade de ingredientes (apenas para receitas da API) */}
          {isApiRecipe && availability.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Disponibilidade no estoque</Text>
              <IngredientAvailability
                ingredients={availability}
                onAddToList={handleAddToShoppingList}
              />
            </>
          )}

          <Text style={styles.sectionTitle}>Ingredientes</Text>
          <View style={styles.ingredientsList}>
            {ingredients.map((item, index) => {
              const nome = typeof item === 'string' ? item : item.nome;
              const qtd = item.quantidade ? `${item.quantidade}${item.unidade ? ' ' + item.unidade : ''}` : '';
              return (
                <View key={index} style={styles.ingredientItem}>
                  <Ionicons name="ellipse" size={6} color={colors.primary} />
                  <Text style={styles.ingredientText}>
                    {qtd ? `${qtd} de ` : ''}{nome}
                    {item.observacoes ? ` (${item.observacoes})` : ''}
                  </Text>
                </View>
              );
            })}
          </View>

          {steps.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Modo de preparo</Text>
              {steps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
      <FooterNav active="Recipes" onNavigate={navigation.replace} />
    </SafeScreen>
  );
}

function MetaCard({ icon, label, value }) {
  return (
    <View style={styles.metaCard}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 120 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { color: "#666", fontSize: 16 },
  backBtnCenter: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnCenterText: { color: "#fff", fontWeight: "600" },

  hero: { height: 280, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  heroPlaceholder: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.15)" },
  videoBtn: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  videoBtnText: { color: "#fff", fontWeight: "700" },
  backBtn: {
    position: "absolute",
    top: 40,
    left: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backBtnText: { color: colors.text, fontWeight: "600" },
  favoriteBtn: {
    position: "absolute",
    top: 40,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 10,
    borderRadius: 999,
  },

  content: { padding: 20, gap: 12 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 10,
  },
  title: { fontSize: 26, fontWeight: "800", color: colors.text, flex: 1 },
  sourceTag: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sourceTagText: { fontSize: 12, color: "#4B5563", fontWeight: "500" },
  description: { fontSize: 15, color: "#666", lineHeight: 22 },

  metaRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  metaCard: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    gap: 4,
  },
  metaLabel: { fontSize: 11, color: colors.mutedText, textTransform: "uppercase" },
  metaValue: { fontSize: 14, fontWeight: "700", color: colors.text },

  sectionTitle: { fontSize: 18, fontWeight: "700", marginTop: 16, color: colors.text },

  ingredientsList: { gap: 8, marginTop: 8 },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 4,
  },
  ingredientText: { fontSize: 15, color: colors.text, flex: 1, lineHeight: 22 },

  stepItem: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  stepText: { flex: 1, fontSize: 15, color: colors.text, lineHeight: 22 },
});
