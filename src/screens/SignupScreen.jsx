import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SafeScreen from "../components/SafeScreen";
import DefaultInput from "../components/DefaultInput";
import PasswordInput from "../components/PasswordInput";
import DefaultButton from "../components/DefaultButton";
import { colors } from "../theme/colors";
import { register } from "../api/auth";
import SuccessModal from "../components/SuccessModal";

export default function SignupScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successVisible, setSuccessVisible] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  async function handleSignup() {
    setErrorMessage("");
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMessage("Preencha todos os campos.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    try {
      setLoading(true);
      const res = await register({
        nome: fullName.trim(),
        email: email.trim().toLowerCase(),
        senha: password,
      });
      setSuccessVisible(true);
    } catch (err) {
      const msg =
      Array.isArray(err?.response?.data?.detail)
      ? err.response.data.detail[0]?.msg
      : err?.response?.data?.detail ||
      err?.message ||
      "Falha ao registrar.";
      setErrorMessage(String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={colors.text}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.headerTitle}>Criar conta</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Nome completo</Text>
          <DefaultInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Digite seu nome..."
            style={styles.field}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />

          <Text style={styles.label}>E-mail</Text>
          <DefaultInput
            ref={emailRef}
            value={email}
            onChangeText={setEmail}
            placeholder="Digite seu e-mail..."
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.field}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <Text style={styles.label}>Senha</Text>
          <PasswordInput
            ref={passwordRef}
            value={password}
            onChangeText={setPassword}
            placeholder="Digite sua senha..."
            style={styles.field}
            returnKeyType="done"
            onSubmitEditing={handleSignup}
          />

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
        </View>

        <DefaultButton
          variant="primary"
          onPress={handleSignup}
          style={{ width: "100%", marginBottom: 20 }}
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </DefaultButton>

        <Text style={styles.or}>ou</Text>

        <Text style={styles.footer}>
          Não quer criar conta?{" "}
          <Text style={styles.link} onPress={() => navigation.navigate("Onboarding")}>
            Entrar como visitante
          </Text>
        </Text>
      </ScrollView>

      <SuccessModal
        visible={successVisible}
        onClose={() => {
          setSuccessVisible(false);
          navigation.navigate("Login", { emailPrefill: email.trim().toLowerCase() });
        }}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 60, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.primary },
  form: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 6 },
  field: { marginBottom: 14 },
  errorText: { color: "red", fontSize: 13, marginTop: 4 },
  or: { textAlign: "center", color: colors.mutedText, marginBottom: 16 },
  footer: { marginTop: 16, textAlign: "center", color: colors.mutedText },
  link: { color: colors.primary, fontWeight: "600" },
});
