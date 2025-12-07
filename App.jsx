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
