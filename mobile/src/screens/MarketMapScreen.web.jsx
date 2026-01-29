import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import SafeScreen from "../components/SafeScreen";
import DefaultButton from "../components/DefaultButton";
import { colors } from "../theme/colors";
import { annotateMarketDistances, getMarketsWithinRadius } from "../data/markets";
import { fetchNearbyMarkets } from "../api/places";
import L from "leaflet";

const RADIUS_OPTIONS = [3, 5, 10, 20];

export default function MarketMapScreenWeb({ navigation }) {
  const [radius, setRadius] = useState(5);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [coords, setCoords] = useState(null);
  const [marketState, setMarketState] = useState({ loading: false, error: "", items: [] });
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerLayerRef = useRef(null);

  const requestLocation = async () => {
    setStatus("loading");
    setErrorMessage("");
    try {
      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== "granted") {
        setStatus("error");
        setErrorMessage("Precisamos da sua localização para calcular as distâncias.");
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
      console.warn("Erro ao buscar localização (web)", err);
      setStatus("error");
      setErrorMessage("Não conseguimos obter sua localização. Tente novamente.");
    }
  };

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const ensures = [];

    const ensureLink = (id, href) => {
      if (document.getElementById(id)) return null;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
      return link;
    };

    const ensureStyle = (id, content) => {
      if (document.getElementById(id)) return null;
      const style = document.createElement("style");
      style.id = id;
      style.innerHTML = content;
      document.head.appendChild(style);
      return style;
    };

    ensures.push(ensureLink("leaflet-css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"));
    ensures.push(
      ensureStyle(
        "market-map-style",
        `.market-pin{position:relative;width:34px;height:34px;border-radius:50%;background:#fff;border:2px solid ${colors.primary};box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;}
.market-pin--faded{border-color:#9ca3af;opacity:0.85;}
.market-pin__inner{width:12px;height:12px;border-radius:50%;background:${colors.primary};position:relative;}
.market-pin__inner::after{content:"";position:absolute;left:50%;top:50%;width:2px;height:10px;background:${colors.primary};transform:translate(-50%, -10px);}
.market-pin--faded .market-pin__inner{background:#9ca3af;}
.market-pin--faded .market-pin__inner::after{background:#9ca3af;}
.market-pin--user{border-color:#2563eb;background:#dbeafe;}
.market-pin--user .market-pin__inner{background:#2563eb;}
`
      )
    );

    return () => {
      ensures.forEach((node) => {
        if (node && node.parentNode) {
          node.parentNode.removeChild(node);
        }
      });
    };
  }, []);

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
        console.warn("Erro Overpass (web)", err);
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
  const visibleMarkets = hasRemoteMarkets
    ? marketState.items
    : fallbackNearby.length > 0
    ? fallbackNearby
    : fallbackSorted;
  const highlightIds = useMemo(() => new Set(visibleMarkets.map((item) => item.id)), [visibleMarkets]);

  const zoomFromRadius = useCallback((value) => {
    if (value <= 3) return 14;
    if (value <= 5) return 13;
    if (value <= 10) return 12;
    if (value <= 15) return 11;
    return 10;
  }, []);

  useEffect(() => {
    if (!coords || !mapContainerRef.current) return;
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        minZoom: 3,
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(mapInstanceRef.current);
      L.control
        .zoom({
          position: "topright",
        })
        .addTo(mapInstanceRef.current);
    }
    mapInstanceRef.current.setView([coords.latitude, coords.longitude], zoomFromRadius(radius));
  }, [coords, radius, zoomFromRadius]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (!markerLayerRef.current) {
      markerLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    } else {
      markerLayerRef.current.clearLayers();
    }

    visibleMarkets.forEach((market) => {
      const icon = L.divIcon({
        className:
          highlightIds.size === 0 || highlightIds.has(market.id)
            ? "market-pin"
            : "market-pin market-pin--faded",
        html: '<span class="market-pin__inner"></span>',
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -30],
      });
      L.marker([market.latitude, market.longitude], { icon })
        .bindPopup(`<strong>${market.name}</strong><br/>${market.address}`)
        .addTo(markerLayerRef.current);
    });

    if (coords) {
      L.circle([coords.latitude, coords.longitude], {
        radius: 120,
        color: "rgba(37,99,235,0.3)",
        fillColor: "rgba(37,99,235,0.12)",
        weight: 2,
      }).addTo(markerLayerRef.current);
      L.circleMarker([coords.latitude, coords.longitude], {
        radius: 7,
        color: "#fff",
        weight: 2,
        fillColor: "#2563eb",
        fillOpacity: 1,
      })
        .bindPopup("Você está aqui")
        .addTo(markerLayerRef.current);
    }
  }, [coords, visibleMarkets, highlightIds]);

  useEffect(
    () => () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
      mapInstanceRef.current = null;
      markerLayerRef.current = null;
    },
    []
  );

  const handleOpenInMaps = (market) => {
    const latLng = `${market.latitude},${market.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latLng}&travelmode=driving`;
    Linking.openURL(url).catch(() => window.open(url, "_blank"));
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lead}>
          Use o mapa abaixo para encontrar mercados próximos, ajustar o raio de busca e abrir rotas
          direto no Google Maps.
        </Text>

        {isLoading && (
          <View style={styles.stateContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.stateText}>Buscando sua localização…</Text>
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
              <View ref={mapContainerRef} style={styles.mapCanvas} />
            </View>

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
  mapWrapper: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 18,
  },
  mapCanvas: {
    width: "100%",
    height: 320,
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
  radiusContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
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
