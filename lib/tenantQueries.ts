import { supabase } from './supabase';

// Get all properties user has access to (across all their tenants)
export async function getPropertiesForUser() {
  const { data, error } = await supabase
    .from("properties")
    .select(`
      *,
      tenants!inner(
        id,
        name,
        tenant_users!inner(
          user_id,
          role,
          status
        )
      )
    `)
    .eq("tenants.tenant_users.user_id", (await supabase.auth.getUser()).data.user?.id)
    .eq("tenants.tenant_users.status", "active")
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  return data;
}

// Get properties for specific tenant (with permission check)
export async function getPropertiesForTenant(tenantId: string) {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  return data;
}

// Get single property with permission check
export async function getPropertyForUser(propertyId: string) {
  const { data, error } = await supabase
    .from("properties")
    .select(`
      *,
      tenants!inner(
        id,
        name,
        tenant_users!inner(
          user_id,
          role,
          status
        )
      )
    `)
    .eq("id", propertyId)
    .eq("tenants.tenant_users.user_id", (await supabase.auth.getUser()).data.user?.id)
    .eq("tenants.tenant_users.status", "active")
    .single();
  
  if (error) throw error;
  return data;
}