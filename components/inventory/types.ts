// components/inventory/types.ts
export type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  category: string;
  threshold: number;
  user_id: string;
  last_updated_by?: string;
  created_at?: string;
  updated_at?: string;
};

export type DefaultStaple = {
  id: string;
  name: string;
  category: string;
  defaultThreshold: number;
  display_order: number;
};

export type CustomStaple = {
  id: string;
  name: string;
  category: string;
  default_threshold: number;
};

export type AllStaple = {
  id: string;
  name: string;
  category: string;
  defaultThreshold: number;
  isFromDatabase: boolean;
  sourceTable: 'default_staples' | 'custom_staples';
  display_order?: number;
};

export type FormData = {
  name: string;
  quantity: number;
  category: string;
  threshold: number;
};

export type StapleFormData = {
  name: string;
  category: string;
  defaultThreshold: number;
};

export const categories = [
  "supplies",
  "cleaning", 
  "kitchen",
  "bathroom",
  "staples",
  "other",
] as const;