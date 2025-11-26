import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SafeScreen from "../components/SafeScreen";
import { colors } from "../theme/colors";

export default function HelpScreen({ navigation }) {
  const faqItems = [
    {
      id: 1,
      question: "Como adicionar itens ao estoque?",
      answer: "Vá para a tela de Estoque e toque no botão '+'. Você pode adicionar itens manualmente, por código de barras ou por voz.",
    },
    {
      id: 2,
      question: "Como funciona o CardapioBot?",
      answer: "O CardapioBot gera cardápios personalizados baseados nas suas preferências, restrições alimentares e itens disponíveis na despensa. Basta conversar com ele e pedir um cardápio para o período desejado.",
    },
    {
      id: 3,
      question: "Como salvar receitas favoritas?",
      answer: "Ao visualizar uma receita, toque no ícone de coração para adicioná-la aos favoritos. Você pode acessar suas receitas salvas no seu perfil.",
    },
    {
      id: 4,
      question: "Como exportar um cardápio em PDF?",
      answer: "Após gerar um cardápio com o CardapioBot, clique no botão 'Baixar cardápio em PDF' que aparece na mensagem. O PDF será gerado e você poderá compartilhá-lo ou salvá-lo.",
    },
    {
      id: 5,
      question: "Como gerenciar permissões do app?",
      answer: "Acesse Configurações > Permissões para ativar ou desativar cada permissão. As permissões incluem localização, notificações, câmera e microfone.",
    },
    {
      id: 6,
      question: "Como editar meu perfil?",
      answer: "Vá para a tela de Perfil e toque em 'Editar' no canto superior esquerdo. Você pode atualizar suas informações pessoais e preferências alimentares.",
    },
    {
      id: 7,
      question: "O app funciona offline?",
      answer: "Algumas funcionalidades básicas funcionam offline, mas para gerar cardápios e buscar receitas você precisará de conexão com a internet.",
    },
    {
      id: 8,
      question: "Como entrar em contato com o suporte?",
      answer: "Você pode enviar suas dúvidas e sugestões através do email: suporte@kitchenbrain.com.br",
    },
  ];

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
        <Text style={styles.header}>Ajuda</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.introSection}>
          <Ionicons name="help-circle" size={60} color={colors.primary} />
          <Text style={styles.introTitle}>Como podemos ajudar?</Text>
          <Text style={styles.introText}>
            Encontre respostas para as perguntas mais frequentes sobre o KitchenBrain
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Perguntas Frequentes</Text>

        {faqItems.map((item) => (
          <View key={item.id} style={styles.faqItem}>
            <View style={styles.questionContainer}>
              <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.question}>{item.question}</Text>
            </View>
            <Text style={styles.answer}>{item.answer}</Text>
          </View>
        ))}

        <View style={styles.contactSection}>
          <Ionicons name="mail" size={40} color={colors.primary} />
          <Text style={styles.contactTitle}>Ainda precisa de ajuda?</Text>
          <Text style={styles.contactText}>
            Entre em contato conosco através do email:
          </Text>
          <Text style={styles.contactEmail}>suporte@kitchenbrain.com.br</Text>
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
  faqItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  questionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  question: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  answer: {
    fontSize: 14,
    color: colors.mutedText,
    lineHeight: 20,
    marginLeft: 28,
  },
  contactSection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: colors.primary50,
    borderRadius: 16,
    marginTop: 24,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: colors.mutedText,
    textAlign: "center",
    marginBottom: 8,
  },
  contactEmail: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
});
