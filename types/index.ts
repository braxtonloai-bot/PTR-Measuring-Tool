// User Role Types
export type UserRole = "owner" | "agent";

export interface UserData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  role: UserRole;
  createdAt: number;
  lastSignInAt: number | null;
}

export interface UsersResponse {
  success: boolean;
  data?: UserData[];
  error?: string;
}

// Pricing Settings Types
export interface PricingSettingsData {
  id: string;
  costPerSqFt: number;
  targetProfit: number;
  gutterPricePerFt: number;
  tier1DealerFee: number;
  tier2DealerFee: number;
  tier3DealerFee: number;
  // Roof feature adjustment prices
  solarPanelPricePerUnit: number;
  skylightPricePerUnit: number;
  satellitePricePerUnit: number;
  updatedAt: Date;
  updatedBy: string | null;
}

export interface PricingSettingsResponse {
  success: boolean;
  data?: PricingSettingsData;
  error?: string;
}

// Roof Analysis Types
export interface RoofSegment {
  areaMeters2: number;
  pitchDegrees: number;
  azimuthDegrees: number;
}

export type SolarApiQuality = "HIGH" | "MEDIUM" | "LOW";

export interface RoofSegmentDetail {
  areaSqFt: number;
  pitchDegrees: number;
  pitch: string;
  azimuthDegrees: number;
}

export interface RoofData {
  roofAreaSqFt: number;
  roofFacets: number;
  predominantPitch: string;
  ridgesHipsFt: number;
  valleysFt: number;
  rakesFt: number;
  eavesFt: number;
  perimeterFt: number;
  dataQuality: SolarApiQuality;
  segments?: RoofSegmentDetail[];
}

export interface GeocodeResult {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  zipCode: string;
  streetViewUrl: string;
  aerialViewUrl: string;
}

// Roof Feature Adjustments (agent inputs)
export interface RoofFeatureAdjustments {
  hasSolarPanels: boolean;
  solarPanelCount: number;
  hasSkylights: boolean;
  skylightCount: number;
  hasSatellites: boolean;
  satelliteCount: number;
}

// Pricing Types
export interface PricingInput {
  sqFt: number;
  costPerSqFt?: number;
  targetProfit?: number;
  includeGutters?: boolean;
  perimeterFt?: number;
  gutterPricePerFt?: number;
  tier1DealerFee?: number;
  tier2DealerFee?: number;
  tier3DealerFee?: number;
  // Roof feature adjustments
  roofFeatures?: RoofFeatureAdjustments;
  solarPanelPricePerUnit?: number;
  skylightPricePerUnit?: number;
  satellitePricePerUnit?: number;
}

export interface RoofFeatureAdjustmentsOutput {
  solarPanelTotal: number;
  skylightTotal: number;
  satelliteTotal: number;
  totalAdjustments: number;
}

export interface PricingOutput {
  cost: number;
  pricePerSqFtCash: number;
  pricePerSqFt5Dealer: number;
  pricePerSqFt10Dealer: number;
  pricePerSqFt18Fee: number;
  pricePerSqFt23Fee: number;
  priceCash: number;
  price5Dealer: number;
  price10Dealer: number;
  commissionCash: number;
  commission5Dealer: number;
  commission10Dealer: number;
  fee13: number;
  profit: number;
  gutterTotal: number;
  roofFeatureAdjustments: RoofFeatureAdjustmentsOutput;
  finalTotal: number;
}

// Property Value Types
export interface PropertyValue {
  price: number;
  priceRangeLow: number;
  priceRangeHigh: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  yearBuilt?: number;
  propertyType?: string;
}

// API Response Types
export interface RoofAnalysisResponse {
  success: boolean;
  data?: RoofData;
  error?: string;
}

export interface GeocodeResponse {
  success: boolean;
  data?: GeocodeResult;
  error?: string;
}

export interface PropertyValueResponse {
  success: boolean;
  data?: PropertyValue;
  error?: string;
}

// Combined Estimate Type
export interface EstimateData {
  address: GeocodeResult;
  roof: RoofData;
  pricing: PricingOutput;
  propertyValue?: PropertyValue;
  roofFeatures?: RoofFeatureAdjustments;
}

// Local Storage Types
export interface StoredSearch {
  id: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  zipCode: string;
  streetViewUrl: string;
  aerialViewUrl: string;
  searchedAt: number;
}

export interface StoredSavedAddress extends StoredSearch {
  nickname?: string;
  savedAt: number;
}

export interface CachedEstimate {
  geocode: GeocodeResult;
  roof: RoofData;
  cachedAt: number;
}

// Training Document Types
export interface TrainingDocumentData {
  id: string;
  name: string;
  filename: string;
  storedName: string;
  type: string;
  category: string;
  description: string | null;
  fileSize: number;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface TrainingDocumentsResponse {
  success: boolean;
  data?: TrainingDocumentData[];
  error?: string;
}

export interface TrainingDocumentResponse {
  success: boolean;
  data?: TrainingDocumentData;
  error?: string;
}

export interface TrainingDocumentUpload {
  name: string;
  category: string;
  description?: string;
}

// Nearby Places Types
export type PlaceCategory = "restaurant" | "school" | "park";
export type SearchRadiusMiles = 5 | 10 | 25;

export interface NearbyPlace {
  placeId: string;
  name: string;
  rating: number;
  userRatingsTotal: number;
  vicinity: string;
  category: PlaceCategory;
  combinedScore: number;
  photoUrl?: string;
  isOpen?: boolean;
}

export interface NearbyPlacesCategory {
  category: PlaceCategory;
  label: string;
  places: NearbyPlace[];
}

export interface NearbyPlacesData {
  categories: NearbyPlacesCategory[];
  searchedAt: number;
  radiusMiles: SearchRadiusMiles;
}

export interface NearbyPlacesResponse {
  success: boolean;
  data?: NearbyPlacesData;
  error?: string;
}

// Population Density Types
export type DensityClassification = "urban" | "suburban" | "rural";

export interface PopulationDensityData {
  population: number;
  landAreaSqMiles: number;
  densityPerSqMile: number;
  classification: DensityClassification;
  tractId: string;
  countyName?: string;
  fetchedAt: number;
}

export interface PopulationDensityResponse {
  success: boolean;
  data?: PopulationDensityData;
  error?: string;
}

// Bulletin Types
// Note: Date fields are strings (ISO format) because JSON serialization
// converts Date objects to strings when sent to client components
export interface BulletinData {
  id: string;
  title: string;
  content: string;
  publishDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isRead: boolean;
}

export interface BulletinCreateInput {
  title: string;
  content: string;
  publishDate?: string;
}

export interface BulletinUpdateInput {
  title?: string;
  content?: string;
  publishDate?: string;
}

export interface BulletinListResponse {
  success: boolean;
  data?: {
    bulletins: BulletinData[];
    unreadCount: number;
  };
  error?: string;
}

export interface BulletinResponse {
  success: boolean;
  data?: BulletinData;
  error?: string;
}
