import { useEffect } from "react";
import { LogBox } from "react-native";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  useEffect(() => {
    LogBox.ignoreLogs([
      "expo-notifications:",
      "`expo-notifications` functionality",
      "[expo-av]",
    ]);
  }, []);

  return <RootNavigator />;
}
