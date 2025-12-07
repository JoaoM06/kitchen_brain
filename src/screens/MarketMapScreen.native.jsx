import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Callout, Circle, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import SafeScreen from "../components/SafeScreen";
import DefaultButton from "../components/DefaultButton";
import { colors } from "../theme/colors";
import { annotateMarketDistances, getMarketsWithinRadius } from "../data/markets";
import { fetchNearbyMarkets } from "../api/places";

const RADIUS_OPTIONS = [3, 5, 10, 20];

export default function MarketMapScreen({ navigation }) {
  const [radius, setRadius] = useState(5);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");
  const [coords, setCoords] = useState(null);
  const [marketState, setMarketState] = useState({ loading: false, error: "", items: [] });

  const requestLocation = async () => {
    setStatus("loading");
    setErrorMessage("");
    try {
      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== "granted") {
        setStatus("error");
        setErrorMessage("Precisamos da sua localização para mostrar mercados próximos.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setStatus("ready");
    } catch (err) {
      console.warn("Erro ao buscar localização", err);
      setStatus("error");
      setErrorMessage("Não conseguimos obter sua localização. Tente novamente em instantes.");
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const loadMarkets = useCallback(
    async (position, searchRadius) => {
      setMarketState((prev) => ({ ...prev, loading: true, error: "" }));
      try {
        const items = await fetchNearbyMarkets(position, searchRadius);
        setMarketState({ loading: false, error: "", items });
      } catch (err) {
        console.warn("Erro ao buscar mercados reais", err);
        setMarketState({
          loading: false,
          error: "Não conseguimos buscar mercados reais agora. Exibindo sugestões salvas.",
          items: [],
        });
      }
    },
    []
  );

  useEffect(() => {
    if (!coords) return;
    loadMarkets(coords, radius);
  }, [coords, radius, loadMarkets]);

  const fallbackSorted = useMemo(() => annotateMarketDistances(coords), [coords]);
  const fallbackNearby = useMemo(
    () => (coords ? getMarketsWithinRadius(coords, radius) : []),
    [coords, radius]
  );

  const hasRemoteMarkets = marketState.items.length > 0;
  const mapMarkets = hasRemoteMarkets ? marketState.items : fallbackSorted;
  const visibleMarkets = hasRemoteMarkets
    ? marketState.items
    : fallbackNearby.length > 0
    ? fallbackNearby
    : fallbackSorted;
  const highlightIds = useMemo(() => {
    const base = hasRemoteMarkets
      ? marketState.items
      : fallbackNearby.length > 0
      ? fallbackNearby
      : fallbackSorted;
    return new Set(base.map((item) => item.id));
  }, [fallbackNearby, fallbackSorted, hasRemoteMarkets, marketState.items]);

  const mapRegion = useMemo(() => {
    if (coords) {
      return {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };
    }
    if (fallbackSorted.length > 0) {
      const first = fallbackSorted[0];
      return {
        latitude: first.latitude,
        longitude: first.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };
    }
    return null;
  }, [coords, fallbackSorted]);

  const handleOpenInMaps = (market) => {
    const latLng = `${market.latitude},${market.longitude}`;
    const label = encodeURIComponent(market.name);
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${latLng}&dirflg=d`,
      android: `https://www.google.com/maps/dir/?api=1&destination=${latLng}&travelmode=driving`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latLng}`,
    });
    Linking.openURL(url).catch(() => {});
  };

  const isLoading = status === "loading";
  const hasError = status === "error";

  return (
    <SafeScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mercados próximos</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lead}>
          Descubra mercados próximos à sua localização para completar a lista de compras e
          economizar tempo.
        </Text>

        {isLoading && (
          <View style={styles.stateContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.stateText}>Buscando sua localização...</Text>
          </View>
        )}

        {hasError && (
          <View style={styles.stateContainer}>
            <Ionicons name="location-off" size={32} color="#ef4444" />
            <Text style={styles.stateText}>{errorMessage}</Text>
            <DefaultButton onPress={requestLocation} style={styles.retryButton}>
              Tentar novamente
            </DefaultButton>
          </View>
        )}

        {!isLoading && !hasError && (
          <>
            <View style={styles.mapWrapper}>
              {mapRegion && (
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  initialRegion={mapRegion}
                  showsUserLocation={!!coords}
                  showsMyLocationButton={false}
                >
                  {mapMarkets.map((market) => {
                    const highlighted = highlightIds.size === 0 || highlightIds.has(market.id);
                    return (
                      <Marker
                        key={market.id}
                        coordinate={{ latitude: market.latitude, longitude: market.longitude }}
                        tracksViewChanges={false}
                        anchor={{ x: 0.5, y: 1 }}
                      >
                        <View style={styles.markerWrapper}>
                          <View
                            style={[
                              styles.marketPin,
                              highlighted ? styles.marketPinActive : styles.marketPinInactive,
                            ]}
                          >
                            <View
                              style={[
                                styles.marketPinInner,
                                highlighted
                                  ? styles.marketPinInnerActive
                                  : styles.marketPinInnerInactive,
                              ]}
                            />
                          </View>
                        </View>
                        <Callout tooltip>
                          <View style={styles.callout}>
                            <Text style={styles.calloutTitle}>{market.name}</Text>
                            <Text style={styles.calloutAddress}>{market.address}</Text>
                          </View>
                        </Callout>
                      </Marker>
                    );
                  })}
                  {coords && (
                    <>
                      <Circle
                        center={coords}
                        radius={150}
                        strokeColor="rgba(37,99,235,0.3)"
                        fillColor="rgba(37,99,235,0.12)"
                        strokeWidth={2}
                        zIndex={0}
                      />
                      <Marker coordinate={coords} tracksViewChanges={false} anchor={{ x: 0.5, y: 0.5 }}>
                        <View style={styles.userDotWrapper}>
                          <View style={styles.userDotPulse} />
                          <View style={styles.userDot} />
                        </View>
                        <Callout>
                          <Text>Você está aqui</Text>
                        </Callout>
                      </Marker>
                    </>
                  )}
                </MapView>
              )}
              <View style={styles.radiusContainer}>
                <Text style={styles.radiusLabel}>Raio de busca</Text>
                <View style={styles.radiusChips}>
                  {RADIUS_OPTIONS.map((option) => {
                    const selected = radius === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.chip, selected && styles.activeChip]}
                        onPress={() => setRadius(option)}
                      >
                        <Text style={[styles.chipText, selected && styles.activeChipText]}>
                          {option} km
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {marketState.loading && (
                  <View style={styles.loadingMarkets}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loadingMarketsText}>Atualizando mercados</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {visibleMarkets.length > 0
                  ? "Mercados no raio selecionado"
                  : "Mercados em destaque"}
              </Text>
              {coords && (
                <Text style={styles.sectionSubtitle}>
                  {visibleMarkets.length > 0
                    ? `${visibleMarkets.length} opções até ${radius} km`
                    : "Exibindo os mais próximos"}
                </Text>
              )}
            </View>

            {marketState.error ? (
              <View style={styles.alert}>
                <Ionicons name="alert-circle" size={18} color="#f97316" />
                <Text style={styles.alertText}>{marketState.error}</Text>
              </View>
            ) : null}

            {visibleMarkets.map((market) => (
              <View key={market.id} style={styles.marketCard}>
                <View style={styles.marketInfo}>
                  <Text style={styles.marketName}>{market.name}</Text>
                  <Text style={styles.marketAddress}>{market.address}</Text>
                  {typeof market.distance === "number" && (
                    <Text style={styles.marketDistance}>{market.distance} km de você</Text>
                  )}
                  <View style={styles.tagRow}>
                    {market.amenities?.map((amenity) => (
                      <View key={amenity} style={styles.tag}>
                        <Text style={styles.tagText}>{amenity}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.routeButton}
                  onPress={() => handleOpenInMaps(market)}
                >
                  <Ionicons name="navigate" size={20} color={colors.background} />
                  <Text style={styles.routeButtonText}>Rotas</Text>
                </TouchableOpacity>
              </View>
            ))}

            {visibleMarkets.length === 0 && (
              <Text style={styles.helperText}>
                Ajuste o raio de busca ou permita a localização para encontrar mercados ainda mais
                pertos.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  markerWrapper: {
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  lead: {
    fontSize: 16,
    color: colors.mutedText,
    lineHeight: 22,
    marginBottom: 18,
  },
  stateContainer: {
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  stateText: {
    textAlign: "center",
    color: colors.text,
    fontSize: 16,
  },
  retryButton: {
    paddingHorizontal: 28,
  },
  mapWrapper: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 18,
  },
  map: {
    width: "100%",
    height: 300,
  },
  callout: {
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 10,
    width: 200,
  },
  calloutTitle: {
    fontWeight: "700",
    marginBottom: 4,
    color: colors.text,
  },
  calloutAddress: {
    color: colors.mutedText,
    fontSize: 13,
  },
  radiusContainer: {
    padding: 16,
    backgroundColor: "#fff",
  },
  radiusLabel: {
    fontWeight: "700",
    marginBottom: 6,
    color: colors.text,
  },
  radiusChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  loadingMarkets: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  loadingMarketsText: {
    color: colors.mutedText,
    fontSize: 13,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  chipText: {
    color: colors.mutedText,
    fontWeight: "600",
  },
  activeChip: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary,
  },
  activeChipText: {
    color: colors.primary,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.mutedText,
  },
  marketCard: {
    borderRadius: 20,
    backgroundColor: "#fff",
    padding: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    marginBottom: 14,
    flexDirection: "row",
    gap: 12,
  },
  marketInfo: {
    flex: 1,
  },
  marketName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  marketAddress: {
    color: colors.mutedText,
    marginTop: 4,
  },
  marketDistance: {
    marginTop: 6,
    fontWeight: "600",
    color: colors.primary,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: colors.primary50,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: colors.primary700,
    fontWeight: "600",
  },
  routeButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  routeButtonText: {
    color: colors.background,
    fontWeight: "700",
  },
  helperText: {
    textAlign: "center",
    color: colors.mutedText,
    marginTop: 10,
  },
  marketPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -10 }],
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  marketPinActive: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  marketPinInactive: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: "#9ca3af",
  },
  marketPinInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  marketPinInnerActive: {
    backgroundColor: colors.primary,
  },
  marketPinInnerInactive: {
    backgroundColor: "#9ca3af",
  },
  userDotWrapper: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  userDotPulse: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(37,99,235,0.15)",
  },
  userDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#2563eb",
    borderWidth: 2,
    borderColor: "#fff",
  },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff7ed",
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  alertText: {
    flex: 1,
    color: "#9a3412",
    fontSize: 13,
  },
});
