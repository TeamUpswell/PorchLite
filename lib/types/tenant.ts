// lib/types/tenant.ts

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  plan: "basic" | "premium" | "enterprise";
  status: "active" | "inactive" | "suspended";
  created_at: string;
  updated_at: string;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: "owner" | "admin" | "manager" | "member";
  invited_by?: string;
  invited_at: string;
  accepted_at?: string;
  created_at: string;
}

export interface TenantSubscription {
  id: string;
  tenant_id: string;
  plan: string;
  status: "active" | "inactive" | "past_due" | "canceled";
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantContextType {
  currentTenant: Tenant | null;
  userTenants: Tenant[];
  isLoading: boolean;
  error: Error | null;
  switchTenant: (tenantId: string) => Promise<void>;
  createTenant: (tenant: Partial<Tenant>) => Promise<Tenant>;
}
