export interface Companion {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  relationship: string;
  age_range: string;
  invited_to_system?: boolean;
  invite_sent_at?: string | null;
}

export interface Reservation {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  guests?: number;
  status?: string;
  allDay?: boolean;
  color?: string;
  user_id?: string;
  companion_count?: number;
  companions?: Companion[];
}

export const roleHierarchy = {
  owner: 1,
  property_manager: 2,
  family: 3,
  friends: 4,
  renter: 5,
  guest: 6,
  service_provider: 7,
  cleaner: 8,
  vendor: 9,
} as const;

export type UserRole = keyof typeof roleHierarchy;