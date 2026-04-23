export type Language = "en" | "hi";

export type Advice = {
  planting: string;
  water: string;
  fertilizer: string;
};

export type CropRecommendation = {
  crop: string;
  confidence: number; // 0..1
  why: string;
  advice: Advice;
};

export type WeatherInfo = {
  temperature: number;   // °C
  humidity: number;      // %
  rainfall: number;      // mm (last 30 days)
};

export type SoilInfo = {
  N: number;   // total N, cg/kg
  P: number;   // estimated P, mg/kg
  K: number;   // estimated K, mg/kg
  ph: number;  // pH in water
};

export type LocationInfo = {
  lat: number;
  lon: number;
  display: string;
};

export type RecommendResponse = {
  recommendation_id: string;
  recommendations: CropRecommendation[];
  weather?: WeatherInfo | null;
  soil?: SoilInfo | null;
  location?: LocationInfo | null;
  note?: string | null;
};

export type RecommendRequest =
  | { village: string }
  | { lat: number; lon: number };

export type FeedbackRequest = {
  recommendation_id: string;
  helpful: boolean;
  comment?: string | null;
};
