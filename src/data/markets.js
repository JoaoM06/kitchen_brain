const MARKETS = [
  {
    id: "sp-mercadao",
    name: "Mercadão Municipal",
    address: "Rua da Cantareira, 306 - Centro",
    latitude: -23.541368,
    longitude: -46.628193,
    amenities: ["Delivery", "Estacionamento"],
  },
  {
    id: "sp-natural",
    name: "Natural da Terra",
    address: "Av. Brigadeiro Luís Antônio, 1901 - Bela Vista",
    latitude: -23.565847,
    longitude: -46.65095,
    amenities: ["Produtos frescos", "Orgânicos"],
  },
  {
    id: "sp-oboticario",
    name: "Empório São Paulo",
    address: "R. Com. Miguel Calfat, 525 - Vila Nova Conceição",
    latitude: -23.588657,
    longitude: -46.673256,
    amenities: ["Gourmet", "Adega"],
  },
  {
    id: "sp-zona-sul",
    name: "Pão de Açúcar Vila Mariana",
    address: "Al. Joaquim Eugênio de Lima, 696 - Jardim Paulista",
    latitude: -23.57084,
    longitude: -46.650078,
    amenities: ["24h", "Retirada rápida"],
  },
  {
    id: "sp-dia",
    name: "Dia Supermercados Cambuci",
    address: "R. Luís Gama, 561 - Cambuci",
    latitude: -23.567875,
    longitude: -46.624936,
    amenities: ["Econômico"],
  },
  {
    id: "sp-st-marche",
    name: "St. Marche Itaim",
    address: "R. João Cachoeira, 899 - Itaim Bibi",
    latitude: -23.583885,
    longitude: -46.678297,
    amenities: ["Gourmet", "Adega"],
  },
];

const EARTH_RADIUS_KM = 6371;

function toRad(value) {
  return (value * Math.PI) / 180;
}

export function getDistanceKm(from, to) {
  if (!from || !to) return null;
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const deltaLat = toRad(to.latitude - from.latitude);
  const deltaLon = toRad(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((EARTH_RADIUS_KM * c).toFixed(1));
}

export function getMarkets() {
  return MARKETS;
}

export function getMarketsWithinRadius(center, radiusKm = 5) {
  if (!center) return [];
  return MARKETS.map((market) => ({
    ...market,
    distance: getDistanceKm(center, { latitude: market.latitude, longitude: market.longitude }),
  }))
    .filter((market) => typeof market.distance === "number" && market.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

export function annotateMarketDistances(center) {
  if (!center) return MARKETS;
  return MARKETS.map((market) => ({
    ...market,
    distance: getDistanceKm(center, { latitude: market.latitude, longitude: market.longitude }),
  })).sort((a, b) => {
    if (a.distance == null) return 1;
    if (b.distance == null) return -1;
    return a.distance - b.distance;
  });
}
