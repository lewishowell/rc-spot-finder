import { FilterOptions, Classification, REGIONS } from "./types";

interface ParsedSearch {
  filters: FilterOptions;
  searchTerms: string[];
}

const CLASSIFICATION_KEYWORDS: Record<string, Classification> = {
  bash: "bash",
  bashing: "bash",
  basher: "bash",
  race: "race",
  racing: "race",
  track: "race",
  tracks: "race",
  raceway: "race",
  crawl: "crawl",
  crawling: "crawl",
  crawler: "crawl",
  rock: "crawl",
  rocks: "crawl",
  trail: "crawl",
  hobby: "hobby",
  shop: "hobby",
  shops: "hobby",
  store: "hobby",
  stores: "hobby",
  airfield: "airfield",
  airfields: "airfield",
  field: "airfield",
  flying: "airfield",
  fly: "airfield",
  plane: "airfield",
  planes: "airfield",
  aircraft: "airfield",
};

const REGION_ALIASES: Record<string, string> = {
  // Regions
  northeast: "Northeast",
  "north east": "Northeast",
  southeast: "Southeast",
  "south east": "Southeast",
  midwest: "Midwest",
  "mid west": "Midwest",
  southwest: "Southwest",
  "south west": "Southwest",

  // California
  ca: "California",
  california: "California",
  cali: "California",

  // Texas
  tx: "Texas",
  texas: "Texas",

  // Florida
  fl: "Florida",
  florida: "Florida",

  // Pacific Northwest
  or: "Pacific Northwest",
  oregon: "Pacific Northwest",
  wa: "Pacific Northwest",
  washington: "Pacific Northwest",
  seattle: "Pacific Northwest",
  portland: "Pacific Northwest",

  // West Coast (CA, OR, WA covered above)
  "west coast": "West Coast",
  westcoast: "West Coast",

  // Northeast states
  me: "Northeast",
  maine: "Northeast",
  nh: "Northeast",
  "new hampshire": "Northeast",
  vt: "Northeast",
  vermont: "Northeast",
  ma: "Northeast",
  massachusetts: "Northeast",
  boston: "Northeast",
  ri: "Northeast",
  "rhode island": "Northeast",
  ct: "Northeast",
  connecticut: "Northeast",
  ny: "Northeast",
  "new york": "Northeast",
  nj: "Northeast",
  "new jersey": "Northeast",
  pa: "Northeast",
  pennsylvania: "Northeast",

  // Southeast states
  va: "Southeast",
  virginia: "Southeast",
  wv: "Southeast",
  "west virginia": "Southeast",
  nc: "Southeast",
  "north carolina": "Southeast",
  sc: "Southeast",
  "south carolina": "Southeast",
  ga: "Southeast",
  georgia: "Southeast",
  atlanta: "Southeast",
  al: "Southeast",
  alabama: "Southeast",
  ms: "Southeast",
  mississippi: "Southeast",
  tn: "Southeast",
  tennessee: "Southeast",
  ky: "Southeast",
  kentucky: "Southeast",

  // Midwest states
  oh: "Midwest",
  ohio: "Midwest",
  mi: "Midwest",
  michigan: "Midwest",
  detroit: "Midwest",
  in: "Midwest",
  indiana: "Midwest",
  il: "Midwest",
  illinois: "Midwest",
  chicago: "Midwest",
  wi: "Midwest",
  wisconsin: "Midwest",
  mn: "Midwest",
  minnesota: "Midwest",
  ia: "Midwest",
  iowa: "Midwest",
  mo: "Midwest",
  missouri: "Midwest",
  nd: "Midwest",
  "north dakota": "Midwest",
  sd: "Midwest",
  "south dakota": "Midwest",
  ne: "Midwest",
  nebraska: "Midwest",
  ks: "Midwest",
  kansas: "Midwest",

  // Southwest states
  az: "Southwest",
  arizona: "Southwest",
  phoenix: "Southwest",
  nm: "Southwest",
  "new mexico": "Southwest",
  nv: "Southwest",
  nevada: "Southwest",
  "las vegas": "Southwest",
  vegas: "Southwest",
  ut: "Southwest",
  utah: "Southwest",
  co: "Southwest",
  colorado: "Southwest",
  denver: "Southwest",

  // Other states
  ak: "Other",
  alaska: "Other",
  hi: "Other",
  hawaii: "Other",
  id: "Other",
  idaho: "Other",
  mt: "Other",
  montana: "Other",
  wy: "Other",
  wyoming: "Other",
  la: "Southeast",
  louisiana: "Southeast",
  ar: "Southeast",
  arkansas: "Southeast",
  ok: "Southwest",
  oklahoma: "Southwest",
  md: "Northeast",
  maryland: "Northeast",
  de: "Northeast",
  delaware: "Northeast",
  dc: "Northeast",
  "washington dc": "Northeast",
  "pacific northwest": "Pacific Northwest",
  pnw: "Pacific Northwest",
};

const RATING_KEYWORDS: Record<string, number> = {
  "5 star": 5,
  "5-star": 5,
  "five star": 5,
  "4 star": 4,
  "4-star": 4,
  "four star": 4,
  best: 5,
  top: 5,
  "highly rated": 4,
  excellent: 5,
  great: 4,
  good: 3,
};

const STOP_WORDS = [
  "show", "me", "all", "the", "find", "search", "for", "get",
  "list", "display", "where", "are", "is", "in", "at", "near",
  "around", "locations", "location", "spots", "spot", "places",
  "place", "areas", "area", "sites", "site", "a", "an", "and",
  "with", "that", "have", "has", "please", "can", "you", "i",
  "want", "to", "see", "looking", "look", "give", "any",
];

export function parseSearchQuery(query: string): ParsedSearch {
  const lowerQuery = query.toLowerCase().trim();
  const filters: FilterOptions = {};
  const searchTerms: string[] = [];

  // Check for classification
  for (const [keyword, classification] of Object.entries(CLASSIFICATION_KEYWORDS)) {
    if (lowerQuery.includes(keyword)) {
      filters.classification = classification;
      break;
    }
  }

  // Check for region
  for (const [alias, region] of Object.entries(REGION_ALIASES)) {
    if (lowerQuery.includes(alias)) {
      filters.region = region;
      break;
    }
  }

  // Also check exact region names
  if (!filters.region) {
    for (const region of REGIONS) {
      if (lowerQuery.includes(region.toLowerCase())) {
        filters.region = region;
        break;
      }
    }
  }

  // Check for rating keywords
  let minRating: number | undefined;
  for (const [keyword, rating] of Object.entries(RATING_KEYWORDS)) {
    if (lowerQuery.includes(keyword)) {
      minRating = rating;
      break;
    }
  }

  // Extract remaining search terms (for name/description matching)
  const words = lowerQuery.split(/\s+/);
  for (const word of words) {
    if (
      word.length > 2 &&
      !STOP_WORDS.includes(word) &&
      !CLASSIFICATION_KEYWORDS[word] &&
      !Object.keys(REGION_ALIASES).includes(word)
    ) {
      searchTerms.push(word);
    }
  }

  return {
    filters,
    searchTerms,
  };
}

export function matchesSearch(
  location: { name: string; description: string | null; rating: number },
  searchTerms: string[],
  minRating?: number
): boolean {
  // Check rating
  if (minRating && location.rating < minRating) {
    return false;
  }

  // If no search terms, match all
  if (searchTerms.length === 0) {
    return true;
  }

  // Check if any search term matches name or description
  const searchableText = `${location.name} ${location.description || ""}`.toLowerCase();
  return searchTerms.some((term) => searchableText.includes(term));
}
