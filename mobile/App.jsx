import { useEffect } from "react";
import { LogBox } from "react-native";
import * as Sentry from "@sentry/react-native";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { AccessibilityProvider } from "./src/AccessibilityContext";

// DSN vem de variável EXPO_PUBLIC_ (inlinada pelo bundler do Expo). Sem DSN
// configurado (ex.: Expo Go local), o Sentry fica desativado e o app exporta
// o componente sem o wrapper.
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.EXPO_PUBLIC_ENVIRONMENT || "development",
    // Começa baixo para não estourar o plano free; ajustar conforme volume.
    tracesSampleRate: 0.1,
    // before_send: não enviar dados sensíveis (o backend tem o seu próprio
    // redactor; aqui evitamos vazar PII de breadcrumbs/contexto do app).
    sendDefaultPii: false,
  });
}

function App() {
  useEffect(() => {
    LogBox.ignoreLogs([
      "expo-notifications:",
      "`expo-notifications` functionality",
      "[expo-av]",
    ]);
  }, []);

  return (
    <AuthProvider>
      <AccessibilityProvider>
        <RootNavigator />
      </AccessibilityProvider>
    </AuthProvider>
  );
}

export default SENTRY_DSN ? Sentry.wrap(App) : App;
