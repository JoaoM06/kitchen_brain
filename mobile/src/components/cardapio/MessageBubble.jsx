// Bolha de mensagem do chat do CardapioBot (texto do usuário/bot, botão de PDF)
// e a linha "digitando".
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { styles } from "./cardapioStyles";
import { TypingDots } from "./primitives";

export const TypingRow = React.memo(() => (
  <View style={[styles.row, styles.left]}>
    <View style={[styles.bubble, styles.botBubble]}>
      <TypingDots />
    </View>
  </View>
));
TypingRow.displayName = "TypingRow";

export const MessageBubble = React.memo(({ item, onGeneratePdf }) => {
  const showButton = !!item.showPdfButton;
  const isGenerating = !!item.generatingPdf;

  return (
    <View style={[styles.row, item.role === "user" ? styles.right : styles.left]}>
      <View
        style={[
          styles.bubble,
          item.role === "user" ? styles.userBubble : styles.botBubble,
          item.error && { borderColor: "#c00", borderWidth: 1 },
        ]}
      >
        {item.role === "bot" && <Text style={styles.botName}>CardapioBot</Text>}
        {!!item.text && <Text style={styles.msgText}>{item.text}</Text>}

        {showButton && (
          <TouchableOpacity
            style={styles.pdfGenerateButton}
            onPress={() => onGeneratePdf?.(item.menuChipForPdf, item.id)}
            disabled={isGenerating}
            activeOpacity={0.8}
          >
            {isGenerating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={styles.pdfGenerateButtonText}>Baixar cardápio em PDF</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});
MessageBubble.displayName = "MessageBubble";
