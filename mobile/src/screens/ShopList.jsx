import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import SafeScreen from "../components/SafeScreen";
import FooterNav from "../components/FooterNav";
import { colors } from "../theme/colors";

export default function ShoppingListScreen({ navigation }) {
  const [selected, setSelected] = useState({
    carne: false,
    yogurte: false,
    pudim: false,
    queijo: false,
  });

  function toggle(item) {
    setSelected({ ...selected, [item]: !selected[item] });
  }

  const listasPreFeitas = [
    { id: 1, titulo: "Semanal", cor: "#4CAF50", qtd: "10/12" },
    { id: 2, titulo: "Pão de forma", cor: "#FFA726", qtd: "10/30" },
    { id: 3, titulo: "Festa Anna", cor: "#EF5350", qtd: "05/11" },
  ];

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.container}>
        
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Lista de compras</Text>

        {/* LISTA */}
        <Text style={styles.sectionTitle}>Lista atual:</Text>

        <View style={styles.checkboxContainer}>
          <Checkbox label="Carne" checked={selected.carne} onPress={() => toggle("carne")} />
          <Checkbox label="Yogurte" checked={selected.yogurte} onPress={() => toggle("yogurte")} />
          <Checkbox label="Pudim" checked={selected.pudim} onPress={() => toggle("pudim")} />
          <Checkbox label="Queijo" checked={selected.queijo} onPress={() => toggle("queijo")} />
        </View>

        {/* PRE FEITAS */}
        <View style={styles.row}>
          <Text style={styles.sectionTitle}>Listas pre-feitas:</Text>
          <TouchableOpacity>
            <Text style={styles.verMais}>Ver mais</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardList}>
          {listasPreFeitas.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={[styles.dot, { backgroundColor: item.cor }]} />
              <Text style={styles.cardTitle}>{item.titulo}</Text>

              <Text style={styles.qtdText}>Você tem: {item.qtd}</Text>
            </View>
          ))}
        </View>

        {/* ADDS COM FREQUÊNCIA */}
        <Text style={styles.sectionTitle}>Adicionados com frequência:</Text>
        <Text style={{ color: "#777", marginTop: 6 }}>— futuro conteúdo —</Text>

        <View style={{ height: 100 }} />

      </ScrollView>

      <FooterNav active="Stock" onNavigate={navigation.replace} />
    </SafeScreen>
  );
}

/* CHECKBOXIS */
function Checkbox({ label, checked, onPress }) {
  return (
    <TouchableOpacity style={styles.checkboxItem} onPress={onPress}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 90,
  },

  back: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    marginVertical: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
  },

  checkboxContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },

  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
    marginVertical: 6,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 6,
    marginRight: 6,
  },

  checkboxChecked: {
    backgroundColor: "#DAF5DA",
    borderColor: colors.primary,
  },

  checkboxLabel: {
    fontSize: 16,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },

  verMais: {
    color: colors.primary,
    fontWeight: "600",
  },

  cardList: {
    marginTop: 12,
    backgroundColor: "#f6f6f6",
    borderRadius: 14,
    paddingVertical: 4,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: "#e4e4e4",
  },

  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },

  qtdText: {
    color: "#666",
    fontSize: 14,
  },
});

