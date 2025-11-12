import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Alert } from "react-native";
import { colors } from "../theme/colors";
import SafeScreen from "../components/SafeScreen";
import DefaultInput from "../components/DefaultInput";
import DefaultButton from "../components/DefaultButton";
import FooterNav from "../components/FooterNav";
import { fetchStock } from "../api/stock";

export default function StockScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (opts = {}) => {
    try {
      if (!opts.silent) setLoading(true);
      const data = await fetchStock({ q: query || undefined }); // ✅ sem token aqui
      setGroups(data?.groups || []);
    } catch (e) {
      console.log("fetch stock error:", e?.response?.data || e.message);
      Alert.alert("Falha", "Não foi possível carregar o estoque.");
    } finally {
      if (!opts.silent) setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData({ silent: true });
    setRefreshing(false);
  };

  const section = (title, items) => (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>
        {items.map((item, idx) => (
          <RowItem
            key={item.id}
            name={item.name}
            expiry={item.expiry || "--/--"}
            status={item.status}
            hasDivider={idx < items.length - 1}
          />
        ))}
      </View>
    </>
  );

  return (
    <SafeScreen>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation?.goBack?.()}>
            <Text style={styles.headerAction}>Voltar</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Estoque</Text>
          <Pressable onPress={() => loadData()}>
            <Text style={styles.headerAction}>{loading ? "..." : "Atualizar"}</Text>
          </Pressable>
        </View>

        <DefaultInput
          value={query}
          onChangeText={setQuery}
          placeholder="Busca"
          style={styles.search}
          returnKeyType="search"
          onSubmitEditing={() => loadData()}
        />

        <DefaultButton
          variant="primary"
          onPress={() => navigation.navigate("AddItemOptions")}
          style={styles.addBtn}
        >
          Adicionar item
        </DefaultButton>

        {groups.length === 0 && (
          <Text style={{ color: colors.mutedText, textAlign: "center", marginTop: 12 }}>
            {loading ? "Carregando..." : "Nenhum item encontrado"}
          </Text>
        )}

        {groups.map((g, idx) => (
          <View key={`${g.location}-${idx}`} style={{ marginBottom: 18 }}>
            {section(g.location, g.items)}
          </View>
        ))}

        <View style={{ height: 90 }} />
      </ScrollView>

      <FooterNav active="Stock" onNavigate={navigation.replace} />
    </SafeScreen>
  );
}

function RowItem({ name, expiry, status, hasDivider }) {
  const dotColor = status === "danger" ? "#EF4444" : status === "warn" ? "#F59E0B" : colors.primary;
  const expiryColor = status === "danger" ? "#EF4444" : status === "warn" ? "#F59E0B" : "#6B7280";
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

  sectionTitle: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 10 },

  card: {
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
});
