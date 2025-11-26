import { useState } from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export default function PasswordInput({
  value,
  onChangeText,
  placeholder,
  returnKeyType,
  onSubmitEditing,
  style,
}) {
  const [hidden, setHidden] = useState(true);

  return (
    <View style={[styles.wrap, style]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedText}
        secureTextEntry={hidden}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
      />

      <Pressable onPress={() => setHidden((h) => !h)} style={styles.iconBtn}>
        <Ionicons
          name={hidden ? "eye-off-outline" : "eye-outline"}
          size={20}
          color={colors.mutedText}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.text,
  },
  iconBtn: {
    padding: 6,
    marginRight: 2,
  },
});
