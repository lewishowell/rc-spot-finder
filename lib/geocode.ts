interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

// Map US states to regions
const STATE_TO_REGION: Record<string, string> = {
  // California (its own region)
  "california": "California", "ca": "California",
  // Texas (its own region)
  "texas": "Texas", "tx": "Texas",
  // Florida (its own region)
  "florida": "Florida", "fl": "Florida",
  // Pacific Northwest
  "washington": "Pacific Northwest", "wa": "Pacific Northwest",
  "oregon": "Pacific Northwest", "or": "Pacific Northwest",
  "idaho": "Pacific Northwest", "id": "Pacific Northwest",
  "montana": "Pacific Northwest", "mt": "Pacific Northwest",
  // West Coast (Hawaii, Alaska)
  "hawaii": "West Coast", "hi": "West Coast",
  "alaska": "West Coast", "ak": "West Coast",
  // Northeast
  "maine": "Northeast", "me": "Northeast",
  "new hampshire": "Northeast", "nh": "Northeast",
  "vermont": "Northeast", "vt": "Northeast",
  "massachusetts": "Northeast", "ma": "Northeast",
  "rhode island": "Northeast", "ri": "Northeast",
  "connecticut": "Northeast", "ct": "Northeast",
  "new york": "Northeast", "ny": "Northeast",
  "new jersey": "Northeast", "nj": "Northeast",
  "pennsylvania": "Northeast", "pa": "Northeast",
  // Southeast
  "delaware": "Southeast", "de": "Southeast",
  "maryland": "Southeast", "md": "Southeast",
  "virginia": "Southeast", "va": "Southeast",
  "west virginia": "Southeast", "wv": "Southeast",
  "north carolina": "Southeast", "nc": "Southeast",
  "south carolina": "Southeast", "sc": "Southeast",
  "georgia": "Southeast", "ga": "Southeast",
  "kentucky": "Southeast", "ky": "Southeast",
  "tennessee": "Southeast", "tn": "Southeast",
  "alabama": "Southeast", "al": "Southeast",
  "mississippi": "Southeast", "ms": "Southeast",
  "louisiana": "Southeast", "la": "Southeast",
  "arkansas": "Southeast", "ar": "Southeast",
  // Midwest
  "ohio": "Midwest", "oh": "Midwest",
  "indiana": "Midwest", "in": "Midwest",
  "illinois": "Midwest", "il": "Midwest",
  "michigan": "Midwest", "mi": "Midwest",
  "wisconsin": "Midwest", "wi": "Midwest",
  "minnesota": "Midwest", "mn": "Midwest",
  "iowa": "Midwest", "ia": "Midwest",
  "missouri": "Midwest", "mo": "Midwest",
  "north dakota": "Midwest", "nd": "Midwest",
  "south dakota": "Midwest", "sd": "Midwest",
  "nebraska": "Midwest", "ne": "Midwest",
  "kansas": "Midwest", "ks": "Midwest",
  // Southwest
  "oklahoma": "Southwest", "ok": "Southwest",
  "new mexico": "Southwest", "nm": "Southwest",
  "arizona": "Southwest", "az": "Southwest",
  "nevada": "Southwest", "nv": "Southwest",
  "utah": "Southwest", "ut": "Southwest",
  "colorado": "Southwest", "co": "Southwest",
  "wyoming": "Southwest", "wy": "Southwest",
};

// Reverse geocode to get region from coordinates
export async function getRegionFromCoordinates(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=5`,
      {
        headers: {
          "User-Agent": "RC-Spot-Finder/1.0",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Extract state from the response
    const state = data.address?.state?.toLowerCase();

    if (state && STATE_TO_REGION[state]) {
      return STATE_TO_REGION[state];
    }

    // If not in US or unknown state, return "Other"
    if (data.address?.country_code === "us") {
      return "Other";
    }

    return null;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}

export async function geocodePlace(query: string): Promise<GeocodeResult | null> {
  try {
    // Use Nominatim (OpenStreetMap's free geocoding service)
    const encoded = encodeURIComponent(query);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1&countrycodes=us`,
      {
        headers: {
          "User-Agent": "RC-Spot-Finder/1.0",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.length === 0) {
      return null;
    }

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

// US state abbreviations and names for matching
const STATE_PATTERN = "alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming|al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy";

// Detect if the search query contains a place reference (city, state pattern)
export function extractPlaceQuery(query: string): string | null {
  // Match patterns like "florence, or" or "bend, oregon" or "seattle washington"
  const patterns = [
    // City, State with comma (e.g., "florence, or" or "los angeles, ca")
    // Captures everything before the comma as city name
    new RegExp(`([a-zA-Z][a-zA-Z\\s]*[a-zA-Z]),\\s*(${STATE_PATTERN})(?:\\s|$)`, "i"),
    // Single word city, state with comma
    new RegExp(`([a-zA-Z]+),\\s*(${STATE_PATTERN})(?:\\s|$)`, "i"),
    // City State without comma at end of query (e.g., "seattle washington")
    new RegExp(`([a-zA-Z]+)\\s+(${STATE_PATTERN})$`, "i"),
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) {
      // Clean up the city name (remove leading/trailing classification words that might have been captured)
      let city = match[1].trim();
      // Remove common prefix words that aren't part of city names
      const prefixWords = ["bash", "race", "crawl", "hobby", "airfield", "boat", "spot", "spots", "track", "tracks", "shop", "shops", "area", "areas", "find", "show", "near"];
      for (const word of prefixWords) {
        const regex = new RegExp(`^${word}\\s+`, "i");
        city = city.replace(regex, "");
      }
      city = city.trim();

      if (city.length > 0) {
        // Return "city, state" format for geocoding
        return `${city}, ${match[2]}`;
      }
    }
  }

  return null;
}
