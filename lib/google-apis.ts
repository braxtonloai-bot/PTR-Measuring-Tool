import type {
  GeocodeResult,
  RoofData,
  RoofSegment,
  RoofSegmentDetail,
  NearbyPlacesData,
  NearbyPlace,
  PlaceCategory,
  NearbyPlacesCategory,
} from "@/types";
import { sqMetersToSqFeet, pitchDegreesToRatio, slopeCorrectionFactor } from "./utils";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const SOLAR_API_BASE = "https://solar.googleapis.com/v1";
const GEOCODING_API_BASE = "https://maps.googleapis.com/maps/api/geocode/json";
const STREET_VIEW_API_BASE = "https://maps.googleapis.com/maps/api/streetview";
const STATIC_MAP_API_BASE = "https://maps.googleapis.com/maps/api/staticmap";
const PLACES_API_BASE =
  "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
const FETCH_TIMEOUT_MS = 10_000;

function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

/**
 * Geocode an address using Google Geocoding API
 */
export async function geocodeAddress(
  address: string
): Promise<GeocodeResult | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps API key is not configured");
  }

  const url = new URL(GEOCODING_API_BASE);
  url.searchParams.set("address", address);
  url.searchParams.set("key", GOOGLE_MAPS_API_KEY);

  const response = await fetchWithTimeout(url.toString());

  if (!response.ok) {
    throw new Error(`Geocoding API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status !== "OK" || !data.results?.length) {
    return null;
  }

  const result = data.results[0];
  const location = result.geometry.location;

  // Extract address components
  const components = result.address_components || [];
  let city = "";
  let state = "";
  let zipCode = "";

  for (const component of components) {
    const types = component.types || [];
    if (types.includes("locality")) {
      city = component.long_name;
    } else if (types.includes("administrative_area_level_1")) {
      state = component.short_name;
    } else if (types.includes("postal_code")) {
      zipCode = component.long_name;
    }
  }

  // Construct Street View URL
  const streetViewUrl = `${STREET_VIEW_API_BASE}?size=800x400&location=${location.lat},${location.lng}&key=${GOOGLE_MAPS_API_KEY}`;

  // Construct Aerial/Satellite View URL
  const aerialViewUrl = `${STATIC_MAP_API_BASE}?center=${location.lat},${location.lng}&zoom=20&size=800x400&maptype=satellite&key=${GOOGLE_MAPS_API_KEY}`;

  return {
    formattedAddress: result.formatted_address,
    latitude: location.lat,
    longitude: location.lng,
    city,
    state,
    zipCode,
    streetViewUrl,
    aerialViewUrl,
  };
}

/**
 * Get building insights from Google Solar API
 * Tries HIGH quality first, then falls back to MEDIUM and LOW if unavailable
 */
export async function getBuildingInsights(
  lat: number,
  lng: number
): Promise<RoofData | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps API key is not configured");
  }

  const qualityLevels = ["HIGH", "MEDIUM", "LOW"] as const;

  for (const quality of qualityLevels) {
    const url = `${SOLAR_API_BASE}/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=${quality}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetchWithTimeout(url);

    if (response.ok) {
      const data = await response.json();

      // Extract roof data from Solar API response
      const solarPotential = data.solarPotential;
      if (!solarPotential) {
        continue; // Try next quality level
      }

      const segments: RoofSegment[] = solarPotential.roofSegmentStats || [];
      const wholeRoofStats = solarPotential.wholeRoofStats;

      // Find predominant pitch (from largest segment)
      const predominantPitch = calculatePredominantPitch(segments);

      // Calculate total roof area with per-segment slope correction.
      // Solar API returns plan-view (horizontal projection) area for each segment.
      // Applying slope correction per-segment is more accurate than using a single
      // predominant pitch, since different roof faces can have different slopes.
      const roofAreaSqFt = segments.length > 0
        ? segments.reduce((sum, seg) => {
            const segPlanSqFt = sqMetersToSqFeet(seg.areaMeters2);
            const segPitch = (seg.pitchDegrees ?? 0) < 7.2 ? 0 : (seg.pitchDegrees ?? 0);
            return sum + segPlanSqFt * slopeCorrectionFactor(segPitch);
          }, 0)
        : wholeRoofStats?.areaMeters2
          ? sqMetersToSqFeet(wholeRoofStats.areaMeters2)
          : 0;

      // Estimate edge lengths (these are approximations based on available data)
      const estimatedPerimeter = estimatePerimeter(roofAreaSqFt, segments.length);

      // Build per-segment detail for transparency
      const segmentDetails: RoofSegmentDetail[] = segments.map((seg) => {
        const segPitch = (seg.pitchDegrees ?? 0) < 7.2 ? 0 : (seg.pitchDegrees ?? 0);
        return {
          areaSqFt: Math.round(sqMetersToSqFeet(seg.areaMeters2) * slopeCorrectionFactor(segPitch)),
          pitchDegrees: Math.round((seg.pitchDegrees ?? 0) * 10) / 10,
          pitch: segPitch === 0 ? "0/12" : pitchDegreesToRatio(segPitch),
          azimuthDegrees: Math.round(seg.azimuthDegrees ?? 0),
        };
      });

      return {
        roofAreaSqFt: Math.round(roofAreaSqFt),
        roofFacets: segments.length || 1,
        predominantPitch,
        ridgesHipsFt: Math.round(estimatedPerimeter * 0.3),
        valleysFt: Math.round(estimatedPerimeter * 0.1),
        rakesFt: Math.round(estimatedPerimeter * 0.25),
        eavesFt: Math.round(estimatedPerimeter * 0.35),
        perimeterFt: Math.round(estimatedPerimeter),
        dataQuality: quality,
        segments: segmentDetails,
      };
    }

    // If 404, try next quality level
    if (response.status === 404) {
      continue;
    }

    // For other errors, throw
    throw new Error(`Solar API error: ${response.statusText}`);
  }

  // No data available at any quality level
  return null;
}

/**
 * Get the predominant pitch in degrees from roof segments (raw numeric value)
 */
function getPredominantPitchDegrees(segments: RoofSegment[]): number {
  if (!segments.length) return 18.43; // Default ~4/12

  const largest = segments.reduce((prev, curr) =>
    curr.areaMeters2 > prev.areaMeters2 ? curr : prev
  );

  const pitchDegrees = largest.pitchDegrees ?? 18.43;
  return pitchDegrees < 7.2 ? 0 : pitchDegrees;
}

/**
 * Calculate predominant pitch from roof segments (formatted as ratio string)
 */
function calculatePredominantPitch(segments: RoofSegment[]): string {
  const degrees = getPredominantPitchDegrees(segments);
  if (degrees === 0) return "0/12";
  return pitchDegreesToRatio(degrees);
}

/**
 * Estimate perimeter based on roof area and number of facets
 * This is an approximation since Solar API doesn't provide exact edge lengths
 */
function estimatePerimeter(areaSqFt: number, facets: number): number {
  // Assuming roughly square proportions per facet
  // Perimeter ≈ 4 * sqrt(area / facets) * facets * adjustment factor
  const avgFacetArea = areaSqFt / Math.max(facets, 1);
  const avgFacetSide = Math.sqrt(avgFacetArea);
  // Factor accounts for rectangular shapes and overlaps (raised from 0.8 to 0.9
  // since 0.8 was consistently underestimating perimeter on real roofs)
  return avgFacetSide * 4 * Math.sqrt(facets) * 0.9;
}

// ============ Solar Data Layers API ============

export interface DataLayerUrls {
  dsmUrl: string;
  rgbUrl: string;
  maskUrl: string;
  annualFluxUrl: string;
}

/**
 * Get Solar API Data Layers (DSM, RGB, roof mask, flux) for a location.
 * Returns download URLs for GeoTIFF rasters that can be used for
 * pixel-level roof analysis - more accurate than Building Insights alone.
 */
export async function getDataLayerUrls(
  lat: number,
  lng: number,
  radiusMeters: number = 50
): Promise<DataLayerUrls | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps API key is not configured");
  }

  const url = `${SOLAR_API_BASE}/dataLayers:get?location.latitude=${lat}&location.longitude=${lng}&radiusMeters=${radiusMeters}&view=FULL_LAYERS&requiredQuality=HIGH&pixelSizeMeters=0.1&key=${GOOGLE_MAPS_API_KEY}`;

  const response = await fetchWithTimeout(url, 30_000);

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Solar Data Layers API error: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    dsmUrl: data.dsmUrl || "",
    rgbUrl: data.rgbUrl || "",
    maskUrl: data.maskUrl || "",
    annualFluxUrl: data.annualFluxUrl || "",
  };
}

// ============ Nearby Places API ============

// Place type mappings for each category (reduced to 3 categories)
const CATEGORY_TYPES: Record<PlaceCategory, string[]> = {
  restaurant: ["restaurant", "cafe"],
  school: ["primary_school", "secondary_school"], // Grades 3-10 (elementary & middle)
  park: ["park"],
};

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  restaurant: "Local Restaurant",
  school: "Nearby School",
  park: "Nearby Park",
};

// Common chain restaurants to filter out (case-insensitive matching)
const CHAIN_RESTAURANTS = [
  "mcdonald",
  "burger king",
  "wendy",
  "taco bell",
  "chick-fil-a",
  "chickfila",
  "chick fil a",
  "subway",
  "starbucks",
  "dunkin",
  "domino",
  "pizza hut",
  "papa john",
  "little caesar",
  "chipotle",
  "panera",
  "five guys",
  "popeye",
  "kfc",
  "kentucky fried",
  "arby",
  "sonic drive",
  "jack in the box",
  "whataburger",
  "in-n-out",
  "in n out",
  "carl's jr",
  "carls jr",
  "hardee",
  "wingstop",
  "buffalo wild wings",
  "applebee",
  "chili's",
  "chilis",
  "olive garden",
  "red lobster",
  "outback",
  "texas roadhouse",
  "cracker barrel",
  "ihop",
  "denny",
  "waffle house",
  "panda express",
  "raising cane",
  "zaxby",
  "bojangle",
  "firehouse sub",
  "jersey mike",
  "jimmy john",
  "potbelly",
  "jason's deli",
  "mcalister",
  "noodles & company",
  "qdoba",
  "moe's",
  "del taco",
  "el pollo loco",
  "checkers",
  "rally's",
  "white castle",
  "culver",
  "dairy queen",
  "baskin robbins",
  "cold stone",
  "krispy kreme",
];

/**
 * Check if a restaurant name is a chain
 * @exported for testing
 */
export function isChainRestaurant(name: string): boolean {
  const lowerName = name.toLowerCase();
  return CHAIN_RESTAURANTS.some((chain) => lowerName.includes(chain));
}

/**
 * Calculate combined score using Bayesian Average (IMDB-style)
 * Formula: (v/(v+m)) * R + (m/(v+m)) * C
 *
 * This algorithm pulls scores toward the average when review count is low,
 * ensuring places need significant reviews to rank highly.
 *
 * @param rating - The place's rating (0-5)
 * @param reviewCount - Number of reviews
 * @returns Bayesian average score
 * @exported for testing
 */
export function calculateCombinedScore(rating: number, reviewCount: number): number {
  // Bayesian Average parameters
  const m = 50;    // Minimum reviews needed for full weight (threshold)
  const C = 3.8;   // Average rating across all places (prior)

  // Bayesian Average formula: (v/(v+m)) * R + (m/(v+m)) * C
  const v = reviewCount;
  const R = rating;

  // Weight factor: how much to trust the actual rating vs the prior
  const weight = v / (v + m);

  // Blend the actual rating with the prior average
  return weight * R + (1 - weight) * C;
}

/**
 * Fetch nearby places for a single category
 * - Only returns places that are currently open
 * - Filters out chain restaurants
 * - Returns only the top 1 result
 */
async function fetchPlacesForCategory(
  lat: number,
  lng: number,
  category: PlaceCategory,
  types: string[],
  radiusMeters: number
): Promise<NearbyPlace[]> {
  const allPlaces: NearbyPlace[] = [];

  // Fetch for each type in the category
  for (const type of types) {
    const url = new URL(PLACES_API_BASE);
    url.searchParams.set("location", `${lat},${lng}`);
    url.searchParams.set("radius", radiusMeters.toString());
    url.searchParams.set("type", type);
    url.searchParams.set("opennow", "true"); // Only fetch places that are open
    url.searchParams.set("key", GOOGLE_MAPS_API_KEY!);

    const response = await fetchWithTimeout(url.toString());

    if (!response.ok) {
      console.error(
        `Places API error for type ${type}: ${response.statusText}`
      );
      continue;
    }

    const data = await response.json();

    if (data.status === "OK" && data.results) {
      const places: NearbyPlace[] = data.results
        .filter((place: { name: string }) => {
          // Filter out chain restaurants
          if (category === "restaurant" && isChainRestaurant(place.name)) {
            return false;
          }
          return true;
        })
        .map(
          (place: {
            place_id: string;
            name: string;
            rating?: number;
            user_ratings_total?: number;
            vicinity: string;
            photos?: Array<{ photo_reference: string }>;
            opening_hours?: { open_now?: boolean };
          }) => ({
            placeId: place.place_id,
            name: place.name,
            rating: place.rating || 0,
            userRatingsTotal: place.user_ratings_total || 0,
            vicinity: place.vicinity,
            category,
            combinedScore: calculateCombinedScore(
              place.rating || 0,
              place.user_ratings_total || 0
            ),
            photoUrl: place.photos?.[0]?.photo_reference
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
              : undefined,
            isOpen: true, // Always true since we're using opennow filter
          })
        );

      allPlaces.push(...places);
    }
  }

  // Deduplicate by placeId and sort by combined score
  const uniquePlaces = Array.from(
    new Map(allPlaces.map((p) => [p.placeId, p])).values()
  );

  return uniquePlaces
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, 1); // Top 1 only
}

// Miles to meters conversion
const MILES_TO_METERS: Record<number, number> = {
  5: 8047,
  10: 16093,
  25: 40234,
};

export type SearchRadiusMiles = 5 | 10 | 25;

/**
 * Get nearby places across 3 categories (restaurant, school, park)
 * - Only returns places that are currently open
 * - Filters out chain restaurants
 * - Returns top 1 per category
 * @param radiusMiles - Search radius in miles (5, 10, or 25)
 */
export async function getNearbyPlaces(
  lat: number,
  lng: number,
  radiusMiles: SearchRadiusMiles = 5
): Promise<NearbyPlacesData | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps API key is not configured");
  }

  const radiusMeters = MILES_TO_METERS[radiusMiles] || MILES_TO_METERS[5];

  // Only 3 categories: restaurant, school, park
  const categories: PlaceCategory[] = ["restaurant", "school", "park"];

  // Fetch all categories in parallel for performance
  const categoryResults: NearbyPlacesCategory[] = await Promise.all(
    categories.map(async (category) => {
      const places = await fetchPlacesForCategory(
        lat,
        lng,
        category,
        CATEGORY_TYPES[category],
        radiusMeters
      );

      return {
        category,
        label: CATEGORY_LABELS[category],
        places,
      };
    })
  );

  return {
    categories: categoryResults,
    searchedAt: Date.now(),
    radiusMiles,
  };
}
