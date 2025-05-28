export interface ManualSection {
  id: string;
  title: string;
  description: string;
  icon?: string;
  order_index: number;
}

export interface ManualItem {
  id: string;
  section_id: string;
  title: string;
  content: string;
  media_urls: string[];
  important: boolean;
  order_index: number;
}