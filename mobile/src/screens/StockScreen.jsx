import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { colors } from "../theme/colors";
import SafeScreen from "../components/SafeScreen";
import DefaultInput from "../components/DefaultInput";
import DefaultButton from "../components/DefaultButton";
import FooterNav from "../components/FooterNav";
import { getStockSections } from "../data/stock";

export default function StockScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const sections = getStockSections();

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation?.goBack?.()}>
            <Text style={styles.headerAction}>Voltar</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Estoque</Text>
          <Pressable onPress={() => {/* TODO: filtro */}}>
            <Text style={styles.headerAction}>Filtro</Text>
          </Pressable>
        </View>

        <DefaultInput
          value={query}
          onChangeText={setQuery}
          placeholder="Busca"
          style={styles.search}
          returnKeyType="search"
        />

        <DefaultButton
          variant="primary"
          onPress={() => navigation.navigate("AddItemOptions")}
          style={styles.addBtn}
        >
          Adicionar item
        </DefaultButton>

        <DefaultButton
          variant="outline"
          onPress={() => navigation.navigate("MarketMap")}
          style={styles.mapBtn}
          textStyle={styles.mapBtnText}
        >
          Encontrar mercados próximos
        </DefaultButton>

        {sections.map((section, sectionIdx) => (
          <View key={section.id}>
            <Text style={[styles.sectionTitle, sectionIdx > 0 && { marginTop: 18 }]}>{section.title}</Text>
            <View style={styles.card}>
              {section.items
                .filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
                .map((item, idx) => (
                  <RowItem
                    key={item.id}
                    name={item.name}
                    expiry={item.expiry}
                    status={item.status}
                    hasDivider={idx < section.items.length - 1}
                  />
                ))}
            </View>
          </View>
        ))}

        <View style={{ height: 90 }} />
      </ScrollView>

      <FooterNav active="Stock" onNavigate={navigation.replace} />
    </SafeScreen>
  );
}

function RowItem({ name, expiry, status, hasDivider }) {
  const dotColor = status === "danger" ? "#EF4444" : colors.primary;
  const expiryColor = status === "danger" ? "#EF4444" : "#6B7280";
  return (
    <>
      <View style={rowStyles.row}>
        <View style={rowStyles.left}>
          <View style={[rowStyles.dot, { backgroundColor: dotColor }]} />
          <Text style={rowStyles.name}>{name}</Text>
        </View>
        <Text style={[rowStyles.expiry, { color: expiryColor }]}>Val:{expiry}</Text>
      </View>
      {hasDivider && <View style={rowStyles.divider} />}
    </>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: { flexDirection: "row", alignItems: "center" },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  name: { fontSize: 16, color: colors.text, fontWeight: "600" },
  expiry: { fontSize: 14, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#EAEAEA", marginHorizontal: 14 },
});

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 24, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 16,
  },
  headerAction: { color: colors.primary, fontSize: 16, fontWeight: "600" },
  headerTitle: { fontSize: 28, fontWeight: "800", color: colors.text },

  search: {
    backgroundColor: colors.inputBackground,
    borderRadius: 28,
    marginBottom: 14,
  },

  addBtn: {
    borderRadius: 28,
    paddingVertical: 14,
    alignSelf: "center",
    width: "86%",
    marginBottom: 18,
  },
  mapBtn: {
    borderRadius: 28,
    paddingVertical: 14,
    alignSelf: "center",
    width: "86%",
    marginBottom: 18,
    borderColor: colors.primary,
  },
  mapBtnText: { color: colors.primary },

  sectionTitle: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 10 },

  card: {
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
});
