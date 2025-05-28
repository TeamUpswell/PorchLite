// types/recommendations.ts
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Recommendation {
  id: string;
  name: string;
  description: string;
  category: string;
  address?: string;
  coordinates?: Coordinates;
  phone_number?: string;
  website?: string;
  images?: string[];
  place_id?: string;
  rating?: number;
  is_recommended?: boolean;
  created_at: string;
}

export interface RecommendationNote {
  id: string;
  recommendation_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

export interface NewRecommendation {
  name: string;
  category: string;
  address: string;
  description: string;
  website: string;
  phone_number: string;
  rating: number;
  images: string[];
  is_recommended: boolean;
  coordinates?: Coordinates;
  place_id?: string;
}
