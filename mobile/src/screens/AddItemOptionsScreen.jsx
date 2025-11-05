import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { colors } from "../theme/colors";
import SafeScreen from "../components/SafeScreen";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function AddItemOptionsScreen({ navigation }) {
  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}>
          <Text style={styles.back}>Voltar</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />

        <OptionButton
          icon={<MaterialCommunityIcons name="pencil-outline" size={22} color="#fff" />}
          title="Adicionar item manualmente"
          onPress={() => {navigation.navigate("NovoItemScreen")}}
        />
        <OptionButton
          icon={<Ionicons name="scan-outline" size={22} color="#fff" />}
          title="Tirar foto do rótulo do item"
          onPress={() => navigation.navigate("BarcodeScannerScreen")} // se já tiver a tela do scanner
        />
        <OptionButton
          icon={<Ionicons name="mic-outline" size={22} color="#fff" />}
          title="Adicionar item por voz"
          onPress={() => {navigation.navigate("VoiceRec")}}
        />
      </ScrollView>
    </SafeScreen>
  );
}

function OptionButton({ icon, title, onPress }) {
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress}>
      <View style={styles.btnIcon}>{icon}</View>
      <Text style={styles.btnText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  back: { color: colors.primary, fontSize: 16, fontWeight: "600" },

  btn: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  btnIcon: {
    width: 28, height: 28, alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
