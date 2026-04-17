// Nominatim (OpenStreetMap) — free, no API key required.
// Rate limit: 1 req/sec. The 400ms debounce in the UI keeps us well under it.
// Usage policy: https://operations.osmfoundation.org/policies/nominatim/

const BASE = 'https://nominatim.openstreetmap.org';
const HEADERS = {
  // Nominatim requires a descriptive User-Agent
  'User-Agent': 'ReliantHomeApp/1.0',
  'Accept-Language': 'en',
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PlaceSuggestion {
  placeId: string;
  description: string;   // full display name
  mainText: string;      // house number + road
  secondaryText: string; // city, state, country
  latitude: number;
  longitude: number;
}

export interface PlaceCoords {
  latitude: number;
  longitude: number;
}

// ─── Nominatim response shape (partial) ──────────────────────────────────────
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

// ─── Autocomplete search ──────────────────────────────────────────────────────
export const fetchPlacesAutocomplete = async (
  input: string,
): Promise<PlaceSuggestion[]> => {
  if (input.length < 3) return [];

  const params = new URLSearchParams({
    q: input,
    format: 'json',
    limit: '6',
    addressdetails: '1',
  });

  try {
    const res = await fetch(`${BASE}/search?${params.toString()}`, {
      headers: HEADERS,
    });
    const data = await res.json() as NominatimResult[];

    return data.map(item => {
      const addr = item.address ?? {};

      const roadPart = [addr.house_number, addr.road].filter(Boolean).join(' ');
      const cityPart = addr.city ?? addr.town ?? addr.village ?? addr.suburb ?? '';
      const regionPart = [cityPart, addr.state, addr.country].filter(Boolean).join(', ');

      return {
        placeId: String(item.place_id),
        description: item.display_name,
        mainText: roadPart || item.display_name.split(',')[0],
        secondaryText: regionPart || item.display_name.split(',').slice(1).join(',').trim(),
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      };
    });
  } catch {
    return [];
  }
};
