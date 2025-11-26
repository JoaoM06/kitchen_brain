import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import SafeScreen from "../components/SafeScreen";
import DefaultInput from "../components/DefaultInput";
import DefaultButton from "../components/DefaultButton";
import FooterNav from "../components/FooterNav";
import { fetchStock, updateStockItem, deleteStockItem } from "../api/stock";

export default function StockScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [itemModalVisible, setItemModalVisible] = useState(false);

  const loadData = useCallback(
    async (opts = {}) => {
      try {
        if (!opts.silent) setLoading(true);
        const data = await fetchStock({ q: query || undefined });
        setGroups(data?.groups || []);
      } catch (e) {
        console.log("fetch stock error:", e?.response?.data || e.message);
        Alert.alert("Falha", "Não foi possível carregar o estoque.");
      } finally {
        if (!opts.silent) setLoading(false);
      }
    },
    [query]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData({ silent: true });
    setRefreshing(false);
  };

  const openItemModal = (item, locationLabel) => {
    setSelectedItem({ ...item, locationLabel });
    setItemModalVisible(true);
  };

  const closeItemModal = () => {
    setItemModalVisible(false);
    setSelectedItem(null);
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
            onPress={() => openItemModal(item, title)}
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
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
          <Text
            style={{
              color: colors.mutedText,
              textAlign: "center",
              marginTop: 12,
            }}
          >
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

      <ItemModal
        visible={itemModalVisible}
        item={selectedItem}
        onClose={closeItemModal}
        onUpdated={async () => {
          closeItemModal();
          await loadData({ silent: true });
        }}
        onDeleted={async () => {
          closeItemModal();
          await loadData({ silent: true });
        }}
      />
    </SafeScreen>
  );
}

function RowItem({ name, expiry, status, hasDivider, onPress }) {
  const dotColor =
    status === "danger" ? "#EF4444" : status === "warn" ? "#F59E0B" : colors.primary;
  const expiryColor =
    status === "danger" ? "#EF4444" : status === "warn" ? "#F59E0B" : "#6B7280";
  return (
    <>
      <Pressable style={rowStyles.row} onPress={onPress}>
        <View style={rowStyles.left}>
          <View style={[rowStyles.dot, { backgroundColor: dotColor }]} />
          <Text style={rowStyles.name}>{name}</Text>
        </View>
        <Text style={[rowStyles.expiry, { color: expiryColor }]}>Val:{expiry}</Text>
      </Pressable>
      {hasDivider && <View style={rowStyles.divider} />}
    </>
  );
}

function ItemModal({ visible, item, onClose, onUpdated, onDeleted }) {
  const [location, setLocation] = useState(null);
  const [expiry, setExpiry] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  React.useEffect(() => {
    if (item) {
      setExpiry(item.expiry || "");
      setLocation(null);
    }
  }, [item]);

  if (!item) return null;

  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);
      await updateStockItem(item.id, {
        location: location || null,
        expiry_text: expiry || null,
      });
      onUpdated && onUpdated();
    } catch (err) {
      console.log("update item error:", err?.response?.data || err.message);
      Alert.alert("Falha", "Não foi possível atualizar o item.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (deleting) return;
    Alert.alert(
      "Excluir item",
      `Tem certeza que deseja excluir "${item.name}" do estoque?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: handleDelete,
        },
      ]
    );
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteStockItem(item.id);
      onDeleted && onDeleted();
    } catch (err) {
      console.log("delete item error:", err?.response?.data || err.message);
      Alert.alert("Falha", "Não foi possível excluir o item.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={modalStyles.backdrop}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={modalStyles.sheet}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>{item.name}</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.mutedText} />
            </Pressable>
          </View>

          <Text style={modalStyles.subtitle}>
            Local: {item.locationLabel || "—"}
          </Text>
          <Text style={modalStyles.subtitle}>Validade atual: {item.expiry || "--/--"}</Text>

          <View style={{ marginTop: 16 }}>
            <Text style={modalStyles.sectionLabel}>Alterar local</Text>
            <View style={modalStyles.rowChoices}>
              {["geladeira", "armário", "armario", "freezer"].map((loc) => (
                <Pressable
                  key={loc}
                  onPress={() => setLocation(loc)}
                  style={[
                    modalStyles.chip,
                    location === loc && modalStyles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      modalStyles.chipText,
                      location === loc && modalStyles.chipTextActive,
                    ]}
                  >
                    {loc}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={modalStyles.sectionLabel}>Alterar validade</Text>
            <DefaultInput
              value={expiry}
              onChangeText={setExpiry}
              placeholder="Validade (ex: 05/11 ou 05/11/2025)"
            />
          </View>

          <View style={modalStyles.actionsRow}>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => [
                modalStyles.saveButton,
                saving && { opacity: 0.7 },
                pressed && !saving && { opacity: 0.85 },
              ]}
            >
              {saving ? (
                <View style={modalStyles.saveContent}>
                  <ActivityIndicator color="#fff" />
                  <Text style={modalStyles.saveText}>Salvando...</Text>
                </View>
              ) : (
                <Text style={modalStyles.saveText}>Salvar alterações</Text>
              )}
            </Pressable>
          </View>

          <Pressable
            style={modalStyles.deleteRow}
            onPress={confirmDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator />
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={modalStyles.deleteText}>Excluir item</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
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

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: { fontSize: 18, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 13, color: colors.mutedText, marginTop: 2 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.mutedText,
    marginBottom: 4,
  },
  rowChoices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },
  chipActive: { borderColor: colors.primary, backgroundColor: "#F1FBF5" },
  chipText: { fontSize: 13, color: colors.text },
  chipTextActive: { color: colors.primary, fontWeight: "700" },
  actionsRow: { marginTop: 20 },
  saveButton: {
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  saveContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  deleteRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  deleteText: { color: "#EF4444", fontWeight: "700", fontSize: 14 },
});
