// src/screens/LoginScreen.js
import { useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import SafeScreen from "../components/SafeScreen";
import DefaultInput from "../components/DefaultInput";
import PasswordInput from "../components/PasswordInput";
import DefaultButton from "../components/DefaultButton";
import { colors } from "../theme/colors";

import { login } from "../api/auth";
// import { TokenStore } from "../api/tokenStore";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successVisible, setSuccessVisible] = useState(false);

  const passwordRef = useRef(null);

  function validate() {
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Informe e-mail e senha.");
      return false;
    }
    setErrorMessage("");
    return true;
  }

  async function handleLogin() {
    if (!validate()) return;
    try {
      setLoading(true);
      const res = await login({ email: email.trim().toLowerCase(), senha: password });
      if (res?.access_token) {
        await AsyncStorage.setItem("auth_token", res.access_token);
      }
      navigation.navigate("Onboarding");
    } catch (err) {
      const msg =
        (Array.isArray(err?.response?.data?.detail) && err.response.data.detail[0]?.msg) ||
        err?.response?.data?.detail ||
        err?.message ||
        "Falha ao entrar.";
      setErrorMessage(String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="chevron-back" size={24} color={colors.text} onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Fazer login</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>E-mail</Text>
          <DefaultInput
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
            onSubmitEditing={handleLogin}
          />

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>

        <DefaultButton
          variant="primary"
          onPress={handleLogin}
          style={{ width: "100%", marginTop: 10 }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </DefaultButton>

        <Text style={styles.forgot} onPress={() => { /* TODO: recuperar senha */ }}>
          Esqueci minha senha
        </Text>

        <Text style={styles.or}>ou</Text>

        <Pressable style={styles.socialButton}>
          <View style={styles.socialContent}>
            <View style={styles.socialIcon}>
              <Ionicons name="logo-google" size={20} color="#DB4437" />
            </View>
            <Text style={styles.socialText}>Entrar com o Google</Text>
          </View>
        </Pressable>

        <Pressable style={styles.socialButton}>
          <View style={styles.socialContent}>
            <View style={styles.socialIcon}>
              <Ionicons name="logo-apple" size={22} color={colors.text} />
            </View>
            <Text style={styles.socialText}>Entrar com a Apple</Text>
          </View>
        </Pressable>

        <Pressable style={styles.socialButton}>
          <View style={styles.socialContent}>
            <View style={styles.socialIcon}>
              <Ionicons name="logo-facebook" size={22} color="#1877F2" />
            </View>
            <Text style={styles.socialText}>Entrar com o Facebook</Text>
          </View>
        </Pressable>

        <Text style={styles.footer}>
          Não tem conta?{" "}
          <Text style={styles.link} onPress={() => navigation.navigate("Signup")}>
            Criar conta
          </Text>
        </Text>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 60, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.primary },

  form: { marginBottom: 8 },
  label: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 6 },
  field: { marginBottom: 14 },
  errorText: { color: "#DC2626", fontSize: 13, marginTop: 4 },

  forgot: { alignSelf: "center", color: colors.primary, fontWeight: "600", marginTop: 20 },
  or: { textAlign: "center", color: colors.mutedText, marginVertical: 16 },

  socialButton: { borderWidth: 1, borderColor: colors.border, borderRadius: 50, paddingVertical: 12, marginBottom: 12 },
  socialContent: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, position: "relative" },
  socialIcon: { position: "absolute", left: 30 },
  socialText: { fontSize: 15, color: colors.text, fontWeight: "500" },

  footer: { marginTop: 16, textAlign: "center", color: colors.mutedText },
  link: { color: colors.primary, fontWeight: "600" },
});
