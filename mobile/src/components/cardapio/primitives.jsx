// Primitivos visuais do CardapioBot (chips, badges, inputs rotulados, dots).
import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { styles } from "./cardapioStyles";

export function Chip({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function Section({ title, description, children }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {description && <Text style={styles.sectionDescription}>{description}</Text>}
      {children}
    </View>
  );
}

export function InfoBadge({ label, value, variant = "default", compact = false }) {
  if (compact) {
    return (
      <View
        style={[
          styles.infoBadgeCompact,
          variant === "warning" && styles.infoBadgeWarning,
        ]}
      >
        <Text style={styles.badgeLabelCompact}>{label}</Text>
        <Text style={styles.badgeValueCompact}>{value}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.infoBadge, variant === "warning" && styles.infoBadgeWarning]}>
      <Text style={styles.badgeLabel}>{label}</Text>
      <Text style={styles.badgeValue}>{value}</Text>
    </View>
  );
}

export function LabeledInput({ label, style, ...props }) {
  return (
    <View style={[styles.inputGroup, style]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput {...props} style={styles.inputBox} placeholderTextColor="#9CA3AF" />
    </View>
  );
}

export function TypingDots() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", height: 18 }}>
      <View style={styles.dot} />
      <View style={[styles.dot, { opacity: 0.6 }]} />
      <View style={[styles.dot, { opacity: 0.3 }]} />
    </View>
  );
}
