import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

const BARCODE_TYPES = ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "qr"];
const ADD_ITEM_ROUTE = "AddItemOptions"; // <- ajuste se seu nome de rota for diferente

export default function BarcodeScannerScreen({ navigation, route }) {
  const isFocused = useIsFocused?.() ?? true;
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const scanningLockRef = useRef(false);

  // último código lido para exibir na tela
  const [lastRead, setLastRead] = useState(null); // { data, type }

  // callback opcional recebido por params (se quiser usar)
  const onScanned = route?.params?.onScanned || (() => {});

  const handleCode = useCallback(async ({ data, type }) => {
    if (scanningLockRef.current) return;
    scanningLockRef.current = true;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    // mostra o resultado na UI
    setLastRead({ data, type });

    // se quiser também avisar quem chamou:
    onScanned({ data, type });

    // mantemos a tela aberta; usuário decide voltar
    // (não damos setTimeout para liberar; deixamos travado até sair da tela)
  }, [onScanned]);

  const Header = useMemo(() => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation?.goBack()}>
        <Ionicons name="chevron-back" size={28} />
      </TouchableOpacity>
      <Text style={styles.title}>Escanear código de barras</Text>
      <TouchableOpacity onPress={() => setTorch(t => !t)}>
        <Ionicons name={torch ? "flashlight" : "flashlight-outline"} size={24} />
      </TouchableOpacity>
    </View>
  ), [navigation, torch]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Verificando permissão da câmera…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.askTitle}>Precisamos da sua câmera</Text>
        <Text style={styles.askText}>Para ler códigos de barras, habilite a câmera.</Text>
        <TouchableOpacity style={styles.askBtn} onPress={requestPermission}>
          <Text style={styles.askBtnText}>Permitir câmera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Header}

      {/* Pausa o preview quando a tela não estiver em foco */}
      {isFocused && (
        <CameraView
          style={styles.camera}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
          onBarcodeScanned={(result) => handleCode(result)}
        />
      )}

      {/* moldura/overlay */}
      <View pointerEvents="none" style={styles.overlay}>
        <View style={styles.mask} />
        <View style={styles.row}>
          <View style={styles.mask} />
          <View style={styles.box} />
          <View style={styles.mask} />
        </View>
        <View style={styles.mask} />
      </View>

      {/* resultado lido + botão voltar */}
      {lastRead && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Código lido</Text>
          <Text style={styles.resultLine}>Tipo: <Text style={styles.bold}>{lastRead.type}</Text></Text>
          <Text selectable style={styles.resultData}>{lastRead.data}</Text>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation?.navigate?.(ADD_ITEM_ROUTE)}
          >
            <Text style={styles.backBtnText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  header: {
    position: "absolute", top: 40, left: 16, right: 16, zIndex: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 8, paddingHorizontal: 6, backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12
  },
  title: { fontWeight: "700", fontSize: 16 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center", alignItems: "center"
  },
  mask: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  row: { height: 240, width: "100%", flexDirection: "row" },
  box: { width: 280, borderWidth: 2, borderColor: "#00E0A4", borderRadius: 12, backgroundColor: "transparent" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  askTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  askText: { textAlign: "center", opacity: 0.8, marginBottom: 16 },
  askBtn: { backgroundColor: "#111", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10 },
  askBtnText: { color: "#fff", fontWeight: "600" },

  resultCard: {
    position: "absolute",
    left: 16, right: 16, bottom: 24,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 16,
    alignItems: "center",
  },
  resultTitle: { fontSize: 16, fontWeight: "800", marginBottom: 6 },
  resultLine: { fontSize: 14, marginBottom: 4 },
  resultData: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  bold: { fontWeight: "700" },

  backBtn: {
    marginTop: 12,
    backgroundColor: "#111",
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: { color: "#fff", fontWeight: "700" },
});
