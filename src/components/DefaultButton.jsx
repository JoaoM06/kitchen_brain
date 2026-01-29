import { Pressable, Text, StyleSheet, View, Platform } from "react-native";
import { colors } from "../theme/colors";

export default function DefaultButton({
  children,
  onPress,
  variant = "primary", // "primary" | "outline"
  style,
  textStyle,
}) {
  const base = [
    styles.base,
    variant === "primary" ? styles.primary : styles.outline,
    style,
  ];

  return (
    <Pressable
      onPress={onPress}
      android_ripple={
        variant === "primary"
          ? { color: "rgba(255,255,255,0.15)" }
          : { color: "rgba(0,0,0,0.06)" }
      }
      style={({ pressed }) => [base, pressed && Platform.OS === "ios" && styles.pressed]}
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.text,
            variant === "primary" ? styles.textPrimary : styles.textOutline,
            textStyle,
          ]}
        >
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.primary,
  },
  outline: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    fontWeight: "600",
    fontSize: 16,
  },
  textPrimary: {
    color: colors.background,
  },
  textOutline: {
    color: colors.text,
  },
  content: { flexDirection: "row", alignItems: "center", gap: 8 },
  pressed: { opacity: 0.85 },
});
