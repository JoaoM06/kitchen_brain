import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking, Alert } from "react-native";
import SafeScreen from "../components/SafeScreen";
import FooterNav from "../components/FooterNav";
import { colors } from "../theme/colors";
import { RECIPES } from "../data/recipes";

export default function RecipeDetailScreen({ route, navigation }) {
  const recipeId = route?.params?.recipeId;
  const recipe = useMemo(() => RECIPES.find((r) => r.id === recipeId) || RECIPES[0], [recipeId]);

  const openVideo = async () => {
    try {
      await Linking.openURL(recipe.videoUrl);
    } catch (err) {
      Alert.alert("Vídeo", "Não consegui abrir o link do YouTube");
    }
  };

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={recipe.image} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <TouchableOpacity style={styles.videoBtn} onPress={openVideo}>
            <Text style={styles.videoBtnText}>Assistir vídeo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Voltar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{recipe.title}</Text>
            <Text style={[styles.tag, { backgroundColor: recipe.statusColor }]}>{recipe.status}</Text>
          </View>

          <View style={styles.metaRow}>
            <MetaCard label="Tempo" value={recipe.prepTime} />
            <MetaCard label="Porções" value={`${recipe.servings} porções`} />
            <MetaCard label="Dificuldade" value={recipe.difficulty} />
          </View>

          <Text style={styles.sectionTitle}>Ingredientes</Text>
          {recipe.ingredients.map((item) => (
            <Text key={item} style={styles.listItem}>• {item}</Text>
          ))}

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Modo de preparo</Text>
          {recipe.steps.map((step, index) => (
            <Text key={step} style={styles.listItem}>{index + 1}. {step}</Text>
          ))}
        </View>
      </ScrollView>
      <FooterNav active="Recipes" onNavigate={navigation.replace} />
    </SafeScreen>
  );
}

function MetaCard({ label, value }) {
  return (
    <View style={styles.metaCard}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 120 },
  hero: { height: 260, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.15)" },
  videoBtn: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  videoBtnText: { color: "#fff", fontWeight: "700" },
  backBtn: {
    position: "absolute",
    top: 40,
    left: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  backBtnText: { color: colors.text, fontWeight: "600" },
  content: { padding: 20, gap: 12 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  tag: { color: "#fff", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, fontWeight: "600" },
  metaRow: { flexDirection: "row", gap: 10 },
  metaCard: { flex: 1, backgroundColor: "#F3F4F6", padding: 12, borderRadius: 12 },
  metaLabel: { fontSize: 12, color: colors.mutedText, textTransform: "uppercase" },
  metaValue: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginTop: 10, color: colors.text },
  listItem: { fontSize: 15, color: colors.text, marginTop: 6, lineHeight: 20 },
});
