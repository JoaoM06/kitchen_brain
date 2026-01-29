import { getDistanceKm } from "../data/markets";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const SHOP_FILTER = '["shop"~"supermarket|convenience|greengrocer|deli|marketplace"]';

const clampRadiusMeters = (radiusKm) => {
  const km = Math.max(1, Math.min(radiusKm, 25));
  return Math.round(km * 1000);
};

const formatAddress = (tags = {}) => {
  const parts = [
    tags["addr:street"],
    tags["addr:housenumber"],
    tags["addr:suburb"],
    tags["addr:city"],
  ].filter(Boolean);
  return parts.join(", ");
};

const extractAmenities = (tags = {}) => {
  const result = [];
  if (tags.delivery === "yes") result.push("Delivery");
  if (tags["opening_hours"]) result.push("Horários definidos");
  if (tags["wheelchair"] === "yes") result.push("Acessível");
  if (tags["organic"] === "only") result.push("Orgânicos");
  return result.slice(0, 3);
};

export async function fetchNearbyMarkets(center, radiusKm = 5) {
  if (!center?.latitude || !center?.longitude) return [];

  const radiusMeters = clampRadiusMeters(radiusKm);
  const query = `[out:json][timeout:25];node${SHOP_FILTER}(around:${radiusMeters},${center.latitude},${center.longitude});out body;`;

  let lastError = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Overpass error ${response.status}: ${text}`);
      }

      const payload = await response.json();
      const elements = Array.isArray(payload?.elements) ? payload.elements : [];

      return elements
        .filter((element) => typeof element.lat === "number" && typeof element.lon === "number")
        .map((element, idx) => {
          const tags = element.tags || {};
          const coords = { latitude: element.lat, longitude: element.lon };
          return {
            id: element.id ? String(element.id) : `${element.lat}-${element.lon}-${idx}`,
            name: tags.name || "Mercado sem nome",
            address: formatAddress(tags) || tags["addr:full"] || "Endereço não informado",
            latitude: element.lat,
            longitude: element.lon,
            amenities: extractAmenities(tags),
            distance: getDistanceKm(center, coords),
          };
        })
        .filter((item) => typeof item.distance === "number")
        .sort((a, b) => a.distance - b.distance);
    } catch (err) {
      lastError = err;
      // tenta o próximo endpoint
    }
  }

  throw lastError || new Error("Não foi possível buscar mercados agora.");
}
