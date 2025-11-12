import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DefaultInput from "../components/DefaultInput";
import DefaultButton from "../components/DefaultButton";
import SafeScreen from "../components/SafeScreen";
import { colors } from "../theme/colors";
import { confirmVoiceItems } from "../api/stock";

export default function ConfirmItemsScreen({ route, navigation }) {
  const initialItems = useMemo(() => route?.params?.items || [], [route?.params?.items]);
  const [rows, setRows] = useState(
    initialItems.map((it) => ({
      source_text: it.source_text,
      product_name: it.product_name,
      product_normalized: it.product_normalized || null,
      candidates: it.candidates || [],
      suggested_action: it.suggested_action,
      chosen_product_generic_id: it.candidates?.[0]?.id || null,
      new_product_name: "",
      location: null,
      quantity: null,
      unit_input: null,
      expiry_text: null,
      open: false
    }))
  );

  const [saving, setSaving] = useState(false);

  const toggleOpen = (idx) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, open: !r.open } : r)));
  };

  const setField = (idx, field, value) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const onChangeCandidate = (idx, candId) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === idx
          ? { ...r, chosen_product_generic_id: candId, new_product_name: "" }
          : r
      )
    );
  };

  const onConfirm = async () => {
    try {
      setSaving(true);

      const selections = rows.map((r) => {
        const createNew =
          !r.chosen_product_generic_id ||
          r.suggested_action === "create_new" ||
          (!!r.new_product_name && r.new_product_name.trim().length > 0);

        return {
          source_text: r.source_text,
          product_name: r.product_name,
          product_normalized: r.product_normalized,
          chosen_product_generic_id: createNew ? null : r.chosen_product_generic_id,
          create_new_if_missing: !!createNew,
          new_product_name: createNew ? (r.new_product_name || r.product_name) : null,
          location: r.location || null,
          quantity: r.quantity != null ? Number(r.quantity) : null,
          unit_input: r.unit_input || null,
          expiry_text: r.expiry_text || null,
        };
      });

      const resp = await confirmVoiceItems(selections);
      Alert.alert("Tudo certo!", `Itens salvos: ${resp.inserted}`);
      navigation.replace("Stock");
    } catch (err) {
      console.log("confirm error:", err?.response?.data || err.message);
      Alert.alert("Falha", "Não foi possível salvar os itens.");
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item, index }) => {
    const topName =
      item.chosen_product_generic_id
        ? (item.candidates.find(c => c.id === item.chosen_product_generic_id)?.name || item.product_name)
        : (item.new_product_name || item.product_name);

    return (
      <View style={s.card}>
        <Pressable style={s.rowTop} onPress={() => toggleOpen(index)}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View>
              <Text style={s.prodName}>{topName}</Text>
              <Text style={s.sub}>{item.source_text}</Text>
            </View>
          </View>
          <Ionicons name={item.open ? "chevron-up" : "chevron-down"} size={18} color={colors.primary} />
        </Pressable>

        {item.open && (
          <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
            {item.candidates?.length > 0 && (
              <>
                <Text style={s.sectionLabel}>Sugestões</Text>
                {item.candidates.map((c) => (
                  <Pressable
                    key={c.id}
                    style={[
                      s.candidate,
                      item.chosen_product_generic_id === c.id && s.candidateActive
                    ]}
                    onPress={() => onChangeCandidate(index, c.id)}
                  >
                    <Text style={s.candidateText}>{c.name}</Text>
                    <Text style={s.candidateScore}>{(c.score * 100).toFixed(0)}%</Text>
                  </Pressable>
                ))}
              </>
            )}

            <Text style={s.sectionLabel}>Local</Text>
            <View style={s.rowChoices}>
              {["geladeira", "armário", "armario", "freezer"].map((loc) => (
                <Pressable
                  key={loc}
                  onPress={() => setField(index, "location", loc)}
                  style={[s.chip, item.location === loc && s.chipActive]}
                >
                  <Text style={[s.chipText, item.location === loc && s.chipTextActive]}>{loc}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <DefaultInput
                value={item.quantity?.toString() || ""}
                onChangeText={(v) => setField(index, "quantity", v.replace(",", "."))}
                placeholder="Qtd"
                keyboardType="numeric"
                style={{ flex: 1 }}
              />
              <DefaultInput
                value={item.unit_input || ""}
                onChangeText={(v) => setField(index, "unit_input", v)}
                placeholder="un | g | kg | ml | l"
                style={{ flex: 1 }}
              />
            </View>

            <DefaultInput
              value={item.expiry_text || ""}
              onChangeText={(v) => setField(index, "expiry_text", v)}
              placeholder="Validade (ex: 05/11 ou '21 de outubro')"
              style={{ marginTop: 8 }}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeScreen>
      <View style={s.header}>
        <Text style={s.title}>Confirmar itens</Text>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        data={rows}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
      />

      <View style={s.footer}>
        <DefaultButton variant="primary" onPress={onConfirm} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : "Confirmar"}
        </DefaultButton>
      </View>
    </SafeScreen>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  title: { fontSize: 22, fontWeight: "800", color: colors.text },
  card: {
    backgroundColor: "#F8F8F8", borderRadius: 14, marginBottom: 12,
    borderWidth: 1, borderColor: "#EEE"
  },
  rowTop: {
    paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between"
  },
  thumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: "#D9D9D9" },
  prodName: { fontSize: 16, fontWeight: "700", color: colors.text },
  sub: { fontSize: 12, color: colors.mutedText, marginTop: 2 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: colors.mutedText, marginTop: 8, marginBottom: 4 },
  candidate: {
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
    borderWidth: 1, borderColor: "#E6E6E6", backgroundColor: "#fff",
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8
  },
  candidateActive: { borderColor: colors.primary, backgroundColor: "#F1FBF5" },
  candidateText: { fontSize: 14, color: colors.text, fontWeight: "600" },
  candidateScore: { fontSize: 12, color: colors.mutedText },
  rowChoices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: "#E6E6E6" },
  chipActive: { borderColor: colors.primary, backgroundColor: "#F1FBF5" },
  chipText: { fontSize: 13, color: colors.text },
  chipTextActive: { color: colors.primary, fontWeight: "700" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: "#fff" },
});
