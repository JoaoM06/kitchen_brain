import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SafeScreen from "../components/SafeScreen";
import { colors } from "../theme/colors";

export default function AboutScreen({ navigation }) {
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
        <Text style={styles.header}>Sobre</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoSection}>
          <Image
            source={require("../../assets/imgs/logo-kitchenbrain.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>KitchenBrain</Text>
          <Text style={styles.version}>Versão 1.0.0</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nossa Missão</Text>
          <Text style={styles.sectionText}>
            O KitchenBrain foi criado para transformar a forma como você planeja suas refeições.
            Combinamos inteligência artificial com praticidade para ajudar você a economizar tempo,
            reduzir desperdícios e comer de forma mais saudável e equilibrada.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>O que fazemos</Text>
          <View style={styles.featureItem}>
            <Ionicons name="restaurant" size={24} color={colors.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Planejamento Inteligente</Text>
              <Text style={styles.featureDesc}>
                Gere cardápios personalizados baseados em suas preferências e restrições alimentares
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="cube" size={24} color={colors.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Gestão de Estoque</Text>
              <Text style={styles.featureDesc}>
                Controle o que você tem em casa e evite desperdícios
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="sparkles" size={24} color={colors.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>IA Conversacional</Text>
              <Text style={styles.featureDesc}>
                Converse naturalmente com o CardapioBot para criar seus planos alimentares
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="trending-down" size={24} color={colors.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Economia Garantida</Text>
              <Text style={styles.featureDesc}>
                Compare preços e aproveite melhor seus ingredientes
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipe</Text>
          <Text style={styles.sectionText}>
            Desenvolvido com dedicação por uma equipe apaixonada por tecnologia e alimentação saudável.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contato</Text>
          <View style={styles.contactItem}>
            <Ionicons name="mail" size={20} color={colors.primary} />
            <Text style={styles.contactText}>contato@kitchenbrain.com.br</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="globe" size={20} color={colors.primary} />
            <Text style={styles.contactText}>www.kitchenbrain.com.br</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 KitchenBrain. Todos os direitos reservados.</Text>
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
  logoSection: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    color: colors.mutedText,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: colors.mutedText,
    lineHeight: 22,
  },
  featureItem: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: colors.mutedText,
    lineHeight: 18,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    color: colors.text,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: colors.mutedText,
  },
});
