// Atalhos de pedido: preenchem a mensagem do chat ao toque.
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../../theme/colors";
import { QUICK_PROMPTS } from "../../utils/cardapioConstants";
import { styles } from "./cardapioStyles";

export function QuickPrompts({ onSelect }) {
  return (
    <View style={styles.quickPromptRow}>
      {QUICK_PROMPTS.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.quickPrompt}
          onPress={() => onSelect?.(item.prompt)}
        >
          <Ionicons name="flash-outline" size={14} color={colors.primary} />
          <Text style={styles.quickPromptText}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
