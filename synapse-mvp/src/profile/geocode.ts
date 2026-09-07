export interface PlaceSuggestion {
  label: string;
  lat: number;
  lon: number;
}

interface PhotonFeature {
  geometry?: { coordinates?: number[] };
  properties?: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    osm_value?: string;
  };
}

function featureLabel(feature: PhotonFeature): string {
  const p = feature.properties || {};
  return [p.name || p.street, p.city, p.state, p.country]
    .filter(Boolean)
    .join(', ');
}

export function parsePhotonResponse(json: unknown): PlaceSuggestion[] {
  if (!json || typeof json !== 'object') return [];
  const features = Array.isArray((json as { features?: unknown }).features)
    ? ((json as { features: PhotonFeature[] }).features)
    : [];
  const out: PlaceSuggestion[] = [];
  for (const feature of features) {
    const coords = feature.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) continue;
    const lon = Number(coords[0]);
    const lat = Number(coords[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const label = featureLabel(feature);
    if (!label) continue;
    out.push({ label: label.slice(0, 120), lat, lon });
  }
  return out.slice(0, 6);
}

export function osmEmbedUrl(lat: number, lon: number): string {
  const pad = 0.06;
  const bbox = [lon - pad, lat - pad, lon + pad, lat + pad].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lon}`)}`;
}

export async function suggestPlaces(
  query: string,
  fetchFn: typeof fetch = fetch
): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6`;
  try {
    const res = await fetchFn(url);
    if (!res.ok) return [];
    return parsePhotonResponse(await res.json());
  } catch {
    return [];
  }
}
