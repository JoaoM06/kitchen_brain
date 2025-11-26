import { View, Text, StyleSheet, Image, FlatList, Pressable, ScrollView, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SafeScreen from "../components/SafeScreen";
import { colors } from "../theme/colors";
import FooterNav from "../components/FooterNav";
import { RECIPES } from "../data/recipes";
import { getLocalStockItems } from "../data/stock";

const getImageSource = (img) => (typeof img === "string" ? { uri: img } : img);

export default function RecipesScreen({ navigation }) {
  const heroRecipe = RECIPES[0];
  const spotlight = RECIPES.slice(1, 3);
  const quickRecipes = RECIPES.filter((item) => parseInt(item.prepTime) <= 30 && item.id !== heroRecipe.id).slice(0, 6);
  const veggieRecipes = RECIPES.filter((item) => item.tags?.includes("veg")).slice(0, 6);
  const categories = [
    { id: "quick", title: "30 min", icon: "flash-outline", color: "#E0F2FE" },
    { id: "comfort", title: "Comfort", icon: "pizza-outline", color: "#FFE4E6" },
    { id: "veggie", title: "Veggie", icon: "leaf-outline", color: "#DCFCE7" },
    { id: "dessert", title: "Doces", icon: "ice-cream-outline", color: "#FCE7F3" },
  ];

  const stockNames = getLocalStockItems().map((item) => item.name.toLowerCase());
  const getRecipeStatus = (recipe) => {
    const ingredientsText = (recipe.ingredients || []).join(" ").toLowerCase();
    const hasStock = stockNames.some((name) => ingredientsText.includes(name));
    return hasStock
      ? { text: "No estoque", color: colors.primary }
      : { text: "Comprar ingredientes", color: "#DC2626" };
  };

  const handleOpenRecipe = (id) => navigation.navigate("RecipeDetail", { recipeId: id });
  const handleWatchVideo = (url) => url && Linking.openURL(url).catch(() => {});

  return (
    <SafeScreen>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Receitas</Text>
          <View style={styles.mainCard}>
            <Image source={require("../../assets/imgs/chef.png")} style={styles.mainImage} />
            <View style={styles.heroPlaceholder}>
              <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.7)" />
              <Text style={styles.heroPlaceholderText}>Reels em breve</Text>
            </View>
          </View>
          <Pressable style={styles.hubBanner} onPress={() => navigation.navigate("RecipeHub")}>
            <View>
              <Text style={styles.hubTitle}>Conheça o Hub de Receitas</Text>
              <Text style={styles.hubSubtitle}>Publique, salve e avalie criações da comunidade</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={32} color="#fff" />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Escolhidas pelo Cubby</Text>
        <FlatList
          data={RECIPES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingRight: 24 }}
          renderItem={({ item }) => (
            <Pressable style={styles.recipeCard} onPress={() => handleOpenRecipe(item.id)}>
              <Image source={getImageSource(item.image)} style={styles.recipeImage} />
              <Text style={styles.recipeName}>{item.title}</Text>
              <Text style={[styles.recipeStatus, { color: getRecipeStatus(item).color }]}>
                {getRecipeStatus(item).text}
              </Text>
            </Pressable>
          )}
        />

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Em destaque</Text>
        <View style={styles.spotlightWrapper}>
          {spotlight.map((item) => (
            <Pressable key={item.id} style={styles.spotlightCard} onPress={() => handleOpenRecipe(item.id)}>
              <Image source={getImageSource(item.image)} style={styles.spotlightImage} />
              <Text style={styles.spotlightTitle}>{item.title}</Text>
              <Text style={styles.spotlightMeta}>{item.difficulty} • {item.prepTime}</Text>
              <Pressable style={styles.videoBadge} onPress={() => handleWatchVideo(item.videoUrl)}>
                <Ionicons name="play" size={14} color="#fff" />
                <Text style={styles.videoBadgeText}>Ver vídeo</Text>
              </Pressable>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Rápidas para hoje</Text>
        <FlatList
          data={quickRecipes}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => `${item.id}-quick`}
          contentContainerStyle={{ paddingRight: 24 }}
          renderItem={({ item }) => (
            <Pressable style={styles.recipeCardSmall} onPress={() => handleOpenRecipe(item.id)}>
              <Image source={getImageSource(item.image)} style={styles.recipeImageSmall} />
              <Text style={styles.recipeNameSmall}>{item.title}</Text>
              <Text style={styles.recipeMetaSmall}>{item.prepTime} • {item.difficulty}</Text>
            </Pressable>
          )}
        />

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Veggie & leve</Text>
        <FlatList
          data={veggieRecipes}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => `${item.id}-veg`}
          contentContainerStyle={{ paddingRight: 24 }}
          renderItem={({ item }) => (
            <Pressable style={styles.recipeCardSmall} onPress={() => handleOpenRecipe(item.id)}>
              <Image source={getImageSource(item.image)} style={styles.recipeImageSmall} />
              <Text style={styles.recipeNameSmall}>{item.title}</Text>
              <Text style={styles.recipeMetaSmall}>{item.prepTime} • {item.difficulty}</Text>
            </Pressable>
          )}
        />

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Categorias</Text>
        <View style={styles.categoriesRow}>
          {categories.map((cat) => (
            <View key={cat.id} style={[styles.categoryCard, { backgroundColor: cat.color }]}>
              <Ionicons name={cat.icon} size={20} color={colors.text} />
              <Text style={styles.categoryText}>{cat.title}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <FooterNav active="Recipes" onNavigate={navigation.replace} />
    </SafeScreen> 
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    backgroundColor: colors.primary,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 12,
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  mainCard: {
    marginHorizontal: 24,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
  },
  mainImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  heroPlaceholder: {
    position: "absolute",
    inset: 0,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  heroPlaceholderText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  hubBanner: {
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hubTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  hubSubtitle: {
    color: "#D1D5DB",
    fontSize: 13,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: 16,
    marginBottom: 12,
    marginLeft: 24,
  },
  recipeCard: {
    width: 130,
    marginLeft: 24,
  },
  recipeImage: {
    width: "100%",
    height: 90,
    borderRadius: 8,
    marginBottom: 8,
  },
  recipeName: { fontWeight: "600", color: colors.text },
  recipeStatus: { fontSize: 12, fontWeight: "500" },
  recipeCardSmall: {
    width: 160,
    marginLeft: 24,
  },
  recipeImageSmall: {
    width: "100%",
    height: 110,
    borderRadius: 12,
    marginBottom: 8,
  },
  recipeNameSmall: { fontWeight: "600", color: colors.text },
  recipeMetaSmall: { fontSize: 12, color: "#6b7280" },
  spotlightWrapper: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 24,
  },
  spotlightCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    padding: 12,
    gap: 6,
  },
  spotlightImage: { width: "100%", height: 90, borderRadius: 12 },
  spotlightTitle: { fontWeight: "700", color: colors.text },
  spotlightMeta: { fontSize: 12, color: "#6b7280" },
  videoBadge: {
    marginTop: 4,
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#0d9488",
  },
  videoBadgeText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  categoriesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginHorizontal: 24,
    marginBottom: 80,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  categoryText: { fontWeight: "600", color: colors.text },
});
