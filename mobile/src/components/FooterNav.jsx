import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export default function FooterNav({ active, onNavigate }) {
  const tabs = [
    { key: "Recipes", icon: "restaurant-outline" },
    { key: "Stock", icon: "cube-outline" },
    { key: "CardapioBotScreen", icon: "stats-chart-outline" },
    { key: "Profile",   icon: "person-outline" },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const focused = tab.key === active;
        return (
          <Pressable key={tab.key} style={styles.tab} onPress={() => onNavigate?.(tab.key)}>
            <Ionicons
              name={tab.icon}
              size={focused ? 26 : 24}
              color={focused ? colors.primary : "#ccc"}
            />
            <View style={[styles.dot, focused && styles.dotActive]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  tab: { alignItems: "center" },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    backgroundColor: "transparent",
  },
  dotActive: { backgroundColor: colors.primary, borderRadius: 4 },
});
