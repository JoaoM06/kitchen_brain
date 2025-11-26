import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SafeScreen from "../components/SafeScreen";
import { colors } from "../theme/colors";
import { useAccessibility } from "../AccessibilityContext";

export default function AccessibilityScreen({ navigation }) {
  const { settings, updateSetting, getFontSize, getFontWeight } = useAccessibility();

  const accessibilityOptions = [
    {
      key: "largeText",
      title: "Texto Grande",
      description: "Aumenta o tamanho do texto em todo o aplicativo",
      icon: "text",
    },
    {
      key: "highContrast",
      title: "Alto Contraste",
      description: "Melhora a legibilidade com cores de maior contraste",
      icon: "contrast",
    },
    {
      key: "colorBlindMode",
      title: "Modo daltônico",
      description: "Inverte as cores para facilitar a leitura",
      icon: "color-palette",
    },
    {
      key: "reduceMotion",
      title: "Reduzir Movimento",
      description: "Minimiza animações e transições",
      icon: "flash-off",
    },
    {
      key: "screenReader",
      title: "Otimizar para Leitor de Tela",
      description: "Melhora a experiência com leitores de tela",
      icon: "headset",
    },
    {
      key: "boldText",
      title: "Texto em Negrito",
      description: "Torna o texto mais espesso e fácil de ler",
      icon: "text-outline",
    },
  ];

  const dynamicStyles = {
    header: {
      fontSize: getFontSize(20),
      fontWeight: getFontWeight("bold"),
    },
    introTitle: {
      fontSize: getFontSize(24),
      fontWeight: getFontWeight("700"),
    },
    introText: {
      fontSize: getFontSize(14),
    },
    sectionTitle: {
      fontSize: getFontSize(18),
      fontWeight: getFontWeight("700"),
    },
    optionTitle: {
      fontSize: getFontSize(16),
      fontWeight: getFontWeight("600"),
    },
    optionDesc: {
      fontSize: getFontSize(13),
    },
  };

  return (
    <SafeScreen>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={[styles.header, dynamicStyles.header]}>Acessibilidade</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.introSection}>
          <Ionicons name="accessibility" size={60} color={colors.primary} />
          <Text style={[styles.introTitle, dynamicStyles.introTitle]}>Recursos de Acessibilidade</Text>
          <Text style={[styles.introText, dynamicStyles.introText]}>
            Personalize sua experiência para tornar o app mais acessível e confortável
          </Text>
        </View>

        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Configurações</Text>

        {accessibilityOptions.map((option) => (
          <View key={option.key} style={styles.optionItem}>
            <View style={styles.iconContainer}>
              <Ionicons name={option.icon} size={24} color={colors.primary} />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, dynamicStyles.optionTitle]}>{option.title}</Text>
              <Text style={[styles.optionDesc, dynamicStyles.optionDesc]}>{option.description}</Text>
            </View>
            <Switch
              value={settings[option.key]}
              onValueChange={(value) => updateSetting(option.key, value)}
              trackColor={{ false: "#d1d5db", true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        ))}

        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Sobre as configurações</Text>
            <Text style={styles.infoDesc}>
              Algumas configurações podem exigir que você reinicie o aplicativo para terem efeito completo.
              Estamos constantemente trabalhando para melhorar a acessibilidade do KitchenBrain.
            </Text>
          </View>
        </View>

        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackTitle}>Tem sugestões de acessibilidade?</Text>
          <Text style={styles.feedbackText}>
            Envie suas sugestões para: acessibilidade@kitchenbrain.com.br
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  introSection: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: colors.mutedText,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 40,
    alignItems: "center",
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 13,
    color: colors.mutedText,
    lineHeight: 18,
  },
  infoSection: {
    flexDirection: "row",
    backgroundColor: colors.primary50,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 13,
    color: colors.mutedText,
    lineHeight: 18,
  },
  feedbackSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: colors.mutedText,
    textAlign: "center",
  },
});
