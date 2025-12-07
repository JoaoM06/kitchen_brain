<<<<<<< HEAD
import { useEffect } from "react";
import { LogBox } from "react-native";
import RootNavigator from "./src/navigation/RootNavigator";
import { AccessibilityProvider } from "./src/AccessibilityContext";

export default function App() {
  useEffect(() => {
    LogBox.ignoreLogs([
      "expo-notifications:",
      "`expo-notifications` functionality",
      "[expo-av]",
    ]);
  }, []);

  return (
    <AccessibilityProvider>
      <RootNavigator />
    </AccessibilityProvider>
  );
}
=======
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
>>>>>>> origin/integracao-funciona-por-favor
