import { View, Text, Image, StyleSheet } from "react-native";
import SafeScreen from "../components/SafeScreen";
import { colors } from "../theme/colors";
import DefaultButton from "../components/DefaultButton";

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeScreen>
      <View style={styles.content}>
        <Image
          source={require("../../assets/imgs/logo-kitchenbrain.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.textBlock}>
          <Text style={styles.title}>Bem-vindo ao KitchenBrain</Text>
          <Text style={styles.subtitle}>
            Pronto para começar sua jornada para uma cozinha mais organizada e uma vida mais saudável?
          </Text>
        </View>

        <DefaultButton
          variant="primary"
          onPress={() => navigation.navigate("Signup")}
          style={styles.btn}
        >
          Criar conta
        </DefaultButton>

        <DefaultButton
          variant="outline"
          onPress={() => navigation.navigate("Login")}
          style={styles.btn}
        >
          Fazer login
        </DefaultButton>

        <Text style={styles.visitorText}>
          Entrar como visitante?{" "}
          <Text
            style={styles.visitorLink}
            onPress={() => navigation.navigate("Onboarding")}
          >
            Entrar
          </Text>
        </Text>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  logo: { width: 220, height: 220, marginBottom: 32 },
  textBlock: { alignItems: "center", marginBottom: 24 },
  title: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.mutedText, textAlign: "center", lineHeight: 20 },
  btn: { width: "100%", marginBottom: 10 },
  visitorText: { color: colors.mutedText, marginTop: 12 },
  visitorLink: { color: colors.primary, fontWeight: "600" },
});