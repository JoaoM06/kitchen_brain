import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, ScrollView } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { lookupBarcode, registerBarcode } from "../api/barcode";

const BARCODE_TYPES = ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"];
const ADD_ITEM_ROUTE = "ManualAdd";

export default function BarcodeScannerScreen({ navigation, route }) {
  const isFocused = useIsFocused?.() ?? true;
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const scanningLockRef = useRef(false);

  const [lastRead, setLastRead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState(null);
  const [error, setError] = useState(null);

  const onScanned = route?.params?.onScanned || (() => {});

  const handleCode = useCallback(async ({ data, type }) => {
    if (scanningLockRef.current) return;
    scanningLockRef.current = true;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    setLastRead({ data, type });
    setError(null);
    setLoading(true);

    try {
      const result = await lookupBarcode(data);
      setProductData(result);

      if (result.found) {
        onScanned({ data, type, product: result });
      }
    } catch (err) {
      console.error("Erro ao buscar código:", err);
      setError("Erro ao buscar produto. Tente novamente.");
      setProductData(null);
    } finally {
      setLoading(false);
    }
  }, [onScanned]);

  const handleAddToStock = useCallback(() => {
    if (!productData) return;

    const productInfo = productData.local_product || productData.external_data;
    const generico = productData.suggested_generico;

    navigation.navigate(ADD_ITEM_ROUTE, {
      barcode: lastRead?.data,
      productName: productInfo?.nome || "",
      productBrand: productInfo?.marca || "",
      productCategory: productInfo?.categoria || "",
      productImage: productInfo?.imagem_url || "",
      genericoId: generico?.id || null,
      genericoName: generico?.nome || "",
      fromBarcode: true,
    });
  }, [productData, lastRead, navigation]);

  const handleScanAgain = useCallback(() => {
    scanningLockRef.current = false;
    setLastRead(null);
    setProductData(null);
    setError(null);
  }, []);

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
        <ActivityIndicator size="large" color="#00E0A4" />
        <Text style={{ marginTop: 12 }}>Verificando permissão da câmera…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={64} color="#999" />
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

      {isFocused && !lastRead && (
        <CameraView
          style={styles.camera}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
          onBarcodeScanned={(result) => handleCode(result)}
        />
      )}

      {!lastRead && (
        <View pointerEvents="none" style={styles.overlay}>
          <View style={styles.mask} />
          <View style={styles.row}>
            <View style={styles.mask} />
            <View style={styles.box} />
            <View style={styles.mask} />
          </View>
          <View style={styles.mask} />
        </View>
      )}

      {lastRead && (
        <ScrollView style={styles.resultContainer} contentContainerStyle={styles.resultContent}>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Código lido</Text>
            <Text style={styles.resultBarcode}>{lastRead.data}</Text>
            <Text style={styles.resultType}>{lastRead.type.toUpperCase()}</Text>

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00E0A4" />
                <Text style={styles.loadingText}>Buscando produto...</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={32} color="#ff4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {productData && !loading && (
              <View style={styles.productContainer}>
                {productData.found ? (
                  <>
                    {(productData.external_data?.imagem_url || productData.local_product?.imagem_url) && (
                      <Image
                        source={{ uri: productData.external_data?.imagem_url || productData.local_product?.imagem_url }}
                        style={styles.productImage}
                        resizeMode="contain"
                      />
                    )}

                    <Text style={styles.productName}>
                      {productData.local_product?.nome || productData.external_data?.nome}
                    </Text>

                    {(productData.local_product?.marca || productData.external_data?.marca) && (
                      <Text style={styles.productBrand}>
                        {productData.local_product?.marca || productData.external_data?.marca}
                      </Text>
                    )}

                    {productData.suggested_generico && (
                      <View style={styles.genericoContainer}>
                        <Ionicons name="link" size={16} color="#00E0A4" />
                        <Text style={styles.genericoText}>
                          Sugestão: {productData.suggested_generico.nome}
                        </Text>
                        <Text style={styles.genericoScore}>
                          ({Math.round(productData.suggested_generico.score * 100)}% match)
                        </Text>
                      </View>
                    )}

                    {productData.local_product && (
                      <View style={styles.localBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#00E0A4" />
                        <Text style={styles.localBadgeText}>Produto já cadastrado</Text>
                      </View>
                    )}

                    {productData.external_data?.nutriscore && (
                      <View style={styles.nutriscoreContainer}>
                        <Text style={styles.nutriscoreLabel}>NutriScore:</Text>
                        <Text style={[
                          styles.nutriscoreBadge,
                          { backgroundColor: getNutriscoreColor(productData.external_data.nutriscore) }
                        ]}>
                          {productData.external_data.nutriscore.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.notFoundContainer}>
                    <Ionicons name="search" size={48} color="#999" />
                    <Text style={styles.notFoundText}>Produto não encontrado</Text>
                    <Text style={styles.notFoundSubtext}>
                      Você pode cadastrar manualmente
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleAddToStock}>
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.primaryBtnText}>Adicionar ao estoque</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryBtn} onPress={handleScanAgain}>
                <Ionicons name="scan" size={20} color="#111" />
                <Text style={styles.secondaryBtnText}>Escanear outro</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function getNutriscoreColor(score) {
  const colors = {
    a: "#038141",
    b: "#85BB2F",
    c: "#FECB02",
    d: "#EE8100",
    e: "#E63E11",
  };
  return colors[score?.toLowerCase()] || "#999";
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  askTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8, marginTop: 16 },
  askText: { textAlign: "center", opacity: 0.8, marginBottom: 16 },
  askBtn: { backgroundColor: "#111", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10 },
  askBtnText: { color: "#fff", fontWeight: "600" },

  resultContainer: { flex: 1, backgroundColor: "#f5f5f5" },
  resultContent: { padding: 16, paddingTop: 100 },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  resultTitle: { fontSize: 14, color: "#666", marginBottom: 4 },
  resultBarcode: { fontSize: 24, fontWeight: "800", marginBottom: 4 },
  resultType: { fontSize: 12, color: "#999", marginBottom: 16 },

  loadingContainer: { alignItems: "center", padding: 20 },
  loadingText: { marginTop: 12, color: "#666" },

  errorContainer: { alignItems: "center", padding: 20 },
  errorText: { marginTop: 8, color: "#ff4444", textAlign: "center" },

  productContainer: { width: "100%", alignItems: "center", marginVertical: 16 },
  productImage: { width: 120, height: 120, marginBottom: 12 },
  productName: { fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 4 },
  productBrand: { fontSize: 14, color: "#666", marginBottom: 8 },

  genericoContainer: {
    flexDirection: "row", alignItems: "center", marginTop: 8,
    backgroundColor: "#e8fff4", padding: 8, borderRadius: 8,
  },
  genericoText: { marginLeft: 6, color: "#00A080", fontWeight: "500" },
  genericoScore: { marginLeft: 4, color: "#666", fontSize: 12 },

  localBadge: {
    flexDirection: "row", alignItems: "center", marginTop: 8,
    backgroundColor: "#e8fff4", padding: 8, borderRadius: 8,
  },
  localBadgeText: { marginLeft: 6, color: "#00A080", fontWeight: "500" },

  nutriscoreContainer: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  nutriscoreLabel: { marginRight: 8, color: "#666" },
  nutriscoreBadge: {
    color: "#fff", fontWeight: "700", paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 4, overflow: "hidden",
  },

  notFoundContainer: { alignItems: "center", padding: 20 },
  notFoundText: { fontSize: 18, fontWeight: "600", marginTop: 12 },
  notFoundSubtext: { color: "#666", marginTop: 4 },

  buttonContainer: { width: "100%", marginTop: 16 },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#00E0A4", paddingVertical: 14, borderRadius: 12, marginBottom: 10,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16, marginLeft: 8 },
  secondaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#f0f0f0", paddingVertical: 14, borderRadius: 12,
  },
  secondaryBtnText: { color: "#111", fontWeight: "600", fontSize: 16, marginLeft: 8 },
});
