import { View, Text, StyleSheet, Image, FlatList, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SafeScreen from "../components/SafeScreen";
import { colors } from "../theme/colors";
import FooterNav from "../components/FooterNav";

const featured = [
  {
    id: "1",
    title: "Parmegiana Carioca",
    image: require("../../assets/imgs/parm.png"),
    status: "Disponível!",
    statusColor: colors.primary,
  },
  {
    id: "2",
    title: "Biscoito Champagne",
    image: require("../../assets/imgs/biscoito.png"),
    status: "Sem Ingrediente",
    statusColor: "#E6A500",
  },
  {
    id: "3",
    title: "Sopa de Espinafre",
    image: require("../../assets/imgs/sopa.png"),
    status: "Disponível!",
    statusColor: colors.primary,
  },
];

export default function RecipesScreen({ navigation }) {
  return (
    <SafeScreen>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
            <Text style={styles.title}>Receitas</Text>

            <View style={styles.mainCard}>
            <Image source={require("../../assets/imgs/chef.png")} style={styles.mainImage} />
            <Pressable style={styles.playButton}>
                {/* <Ionicons name="play-circle" size={64} color="rgba(0,0,0,0.4)" /> */}
            </Pressable>
            </View>
        </View>

        <Text style={styles.sectionTitle}>Escolhidas pelo Cubby</Text>
        <FlatList
          data={featured}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingRight: 24 }}
          renderItem={({ item }) => (
            <View style={styles.recipeCard}>
              <Image source={item.image} style={styles.recipeImage} />
              <Text style={styles.recipeName}>{item.title}</Text>
              <Text style={[styles.recipeStatus, { color: item.statusColor }]}>{item.status}</Text>
            </View>
          )}
        />

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Populares</Text>
        <View style={styles.popularPlaceholder}>
          <View style={styles.popularBox} />
          <View style={styles.popularBox} />
          <View style={styles.popularBox} />
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
    height: 280,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 16,
  },
  mainCard: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    marginHorizontal: 24,
    overflow: "hidden",
  },
  mainImage: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    resizeMode: "cover",
  },
  playButton: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
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
  popularPlaceholder: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
    marginBottom: 80,
  },
  popularBox: {
    width: 90,
    height: 90,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
});