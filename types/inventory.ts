export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  category?: string; // Make sure this is optional
  description?: string;
  threshold?: number;
  user_id: string;
  location?: string; // Add this line
  created_at?: string;
  updated_at?: string | null;
}
