import { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SafeScreen from "../components/SafeScreen";
import DefaultButton from "../components/DefaultButton";
import { colors } from "../theme/colors";

const { width } = Dimensions.get("window");

const SLIDES = [
    {
        id: "1",
        title: "Descubra novas receitas",
        subtitle:
        "Encontre sugestões de pratos usando os ingredientes que você já tem. Cozinhar pode ser simples e gostoso.",
        image: require("../../assets/imgs/onboarding1.png"),
    },
    {
        id: "2",
        title: "Controle sua dispensa",
        subtitle:
        "Saiba exatamente o que tem em casa, evite desperdícios e planeje melhor suas refeições.",
        image: require("../../assets/imgs/onboarding2.png"),
    },
    {
        id: "3",
        title: "Encontre bons preços",
        subtitle:
        "Compare preços em diferentes mercados e faça escolhas mais econômicas na hora de comprar.",
        image: require("../../assets/imgs/onboarding3.png"),
    },
    {
        id: "4",
        title: "Cozinha descomplicada",
        subtitle:
        "Receitas fáceis, dicas úteis e menos estresse na hora de cozinhar — todo dia fica mais leve.",
        image: require("../../assets/imgs/onboarding4.png"),
    },
];

export default function OnboardingScreen({ navigation }) {
    const listRef = useRef(null);
    const [index, setIndex] = useState(0);

    const goNext = () => {
        if (index < SLIDES.length - 1) {
        const nextIndex = index + 1;
        setIndex(nextIndex);
        listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        } else {
        navigation.replace("Recipes");
        }
    };

    const skipAll = () => navigation.replace("Recipes");

    return (
        <SafeScreen>
            <View style={{ flex: 1 }}>
                <View style={styles.skipWrap}>
                    <Text style={styles.skip} onPress={skipAll}>
                    Pular
                    </Text>
                </View>

                <FlatList
                    ref={listRef}
                    data={SLIDES}
                    keyExtractor={(i) => i.id}
                    horizontal
                    pagingEnabled
                    scrollEnabled={true}
                    bounces={false}
                    showsHorizontalScrollIndicator={false}
                    style={{ flex: 1 }}
                    snapToInterval={width}
                    decelerationRate="fast"
                    getItemLayout={(data, index) => ({
                        length: width,
                        offset: width * index,
                        index,
                    })}
                    onMomentumScrollEnd={(e) => {
                    const i = Math.round(e.nativeEvent.contentOffset.x / width);
                    setIndex(i);
                    }}
                    onScrollToIndexFailed={(info) => {
                    const wait = new Promise(resolve => setTimeout(resolve, 500));
                    wait.then(() => {
                      listRef.current?.scrollToIndex({ index: info.index, animated: true });
                    });
                    }}
                    renderItem={({ item }) => <Slide item={item} />}
                />

                <View
                    style={[
                        styles.bottomBar,
                        index === SLIDES.length - 1 && styles.bottomBarLast,
                    ]}
                    >
                    {index < SLIDES.length - 1 && <Dots total={SLIDES.length} active={index} />}

                    {index < SLIDES.length - 1 ? (
                        <Pressable style={styles.fab} onPress={goNext}>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </Pressable>
                    ) : (
                        <DefaultButton variant="primary" onPress={goNext} style={{ width: "60%" }}>
                        Começar
                        </DefaultButton>
                    )}
                </View>
            </View>
        </SafeScreen>
    );
}

function Slide({ item }) {
  return (
    <View style={{ width, paddingHorizontal: 24, justifyContent: 'center' }}>
      <View style={styles.illustrationWrap}>
        <Image
          source={typeof item.image === "string" ? { uri: item.image } : item.image}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );
}

function Dots({ total, active }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.dotItem, i === active && styles.dotItemActive]}
        />
      ))}
    </View>
  );
}

const CIRCLE = 280;

const styles = StyleSheet.create({
  skipWrap: {
    alignItems: "flex-end",
    paddingHorizontal: 30,
    paddingTop: 4,
    marginTop: 50,
    marginBottom: 30,
  },
  skip: { color: colors.primary, fontWeight: "600", fontSize: 16 },

  illustrationWrap: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 18,
  },
  image: { width: CIRCLE , height: CIRCLE },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginTop: 40,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedText,
    lineHeight: 20,
    textAlign: "center",
  },

  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 50,
  },
  dots: { flexDirection: "row", alignItems: "center", gap: 6 },
  dotItem: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D1D5DB",
  },
  dotItemActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  fab: {
    width: 70,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 30,
    top: "50%",
    marginTop: -12,
  },
});