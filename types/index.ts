// This file exports TypeScript types and interfaces used throughout the application.

// Type for a reservation in the shared usage calendar
export interface Reservation {
  id: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Type for a task in the task management board
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in-progress" | "completed";
  assignedTo?: string; // userId of the person assigned to the task
  createdAt: Date;
  updatedAt: Date;
}

// Type for a note
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Type for an inventory item
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

// Type for user authentication
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Property type definitions
export interface PropertyFormData {
  id?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  max_occupancy: number;
  description: string;
  latitude: number | null;
  longitude: number | null;
  neighborhood_description: string;
  wifi_name: string;
  wifi_password: string;
  check_in_instructions: string;
  check_out_instructions: string;
  house_rules: string;
  security_info: string;
  parking_info: string;
  amenities: string[];
  main_photo_url?: string;
  created_at?: string;
  updated_at?: string;
}

// Type for a property
export interface Property {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  description?: string;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  max_occupancy?: number;
  main_photo_url?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}
