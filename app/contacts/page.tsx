"use client";

import { useViewMode } from "@/lib/hooks/useViewMode";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Users, Phone, Mail, MapPin, Edit, Plus } from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import { PropertyGuard } from "@/components/ui/PropertyGuard";

// Types
interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  category: string;
  address?: string;
  notes?: string;
  property_id: string;
  created_at: string;
  is_public?: boolean;
}

interface CategoryInfo {
  id: string;
  name: string;
  icon: string;
}

// Constants
const CATEGORIES: CategoryInfo[] = [
  { id: "maintenance", name: "Maintenance", icon: "🔧" },
  { id: "emergency", name: "Emergency", icon: "🚨" },
  { id: "vendor", name: "Vendor", icon: "🏪" },
  { id: "guest", name: "Guest", icon: "👤" },
  { id: "contractor", name: "Contractor", icon: "👷" },
  { id: "service", name: "Service", icon: "🛠️" },
  { id: "property", name: "Property", icon: "🏠" },
];

export default function ContactsPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const { isManagerView, isFamilyView, isGuestView } = useViewMode();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent multiple fetches and track component mount
  const fetchingRef = useRef(false);
  const hasFetchedRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  // Memoize loading states
  const isLoading = useMemo(() => {
    return authLoading || propertyLoading;
  }, [authLoading, propertyLoading]);

  // Component cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Optimized fetch function
  const fetchContacts = useCallback(async (property_id: string) => {
    // Prevent duplicate fetches
    if (fetchingRef.current || hasFetchedRef.current === property_id) {
      return;
    }

    fetchingRef.current = true;
    hasFetchedRef.current = property_id;

    try {
      console.log("📞 Fetching contacts for property:", property_id);
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("property_id", property_id)
        .order("name");

      if (error) throw error;

      if (mountedRef.current) {
        console.log("✅ Contacts loaded:", data?.length || 0);
        setContacts(data || []);
      }
    } catch (error) {
      console.error("❌ Error fetching contacts:", error);

      if (mountedRef.current) {
        // Only use demo data if it's a "not found" or "no data" scenario
        const isNoDataError =
          error instanceof Error &&
          (error.message.includes("does not exist") ||
            error.message.includes("not found"));

        if (isNoDataError) {
          console.log("📞 Using demo data for testing");
          const demoContacts: Contact[] = [
            {
              id: "demo-1",
              name: "John's Plumbing",
              email: "john@plumbing.com",
              phone: "(555) 123-4567",
              category: "maintenance",
              address: "123 Main St, City, ST 12345",
              notes: "Available 24/7 for emergencies",
              property_id: property_id,
              created_at: new Date().toISOString(),
            },
            {
              id: "demo-2",
              name: "Emergency Services",
              phone: "911",
              category: "emergency",
              notes: "Police, Fire, Medical",
              property_id: property_id,
              created_at: new Date().toISOString(),
            },
            {
              id: "demo-3",
              name: "ABC Cleaning Service",
              email: "info@abccleaning.com",
              phone: "(555) 987-6543",
              category: "service",
              address: "456 Oak Ave, City, ST 12345",
              property_id: property_id,
              created_at: new Date().toISOString(),
            },
          ];
          setContacts(demoContacts);
        } else {
          // Real error - show error state
          setError("Failed to load contacts. Please try again.");
          setContacts([]);
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, []);

  // Single useEffect with proper dependencies
  useEffect(() => {
    if (isLoading || !user || !currentProperty?.id) {
      if (!isLoading) {
        setLoading(false);
      }
      return;
    }

    console.log("🔍 CONTACTS - User and property loaded, fetching contacts");
    fetchContacts(currentProperty.id);
  }, [user, currentProperty?.id, isLoading, fetchContacts]);

  // Reset fetch tracking when property changes
  useEffect(() => {
    if (currentProperty?.id !== hasFetchedRef.current) {
      hasFetchedRef.current = null;
      fetchingRef.current = false;
      setContacts([]);
      setError(null);
    }
  }, [currentProperty?.id]);

  // Memoized category lookup
  const getCategoryInfo = useCallback((categoryId: string): CategoryInfo => {
    return (
      CATEGORIES.find((cat) => cat.id === categoryId) || {
        id: categoryId,
        name: categoryId,
        icon: "👤",
      }
    );
  }, []);

  // Memoized filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      if (isGuestView) {
        return contact.category === "emergency" || contact.is_public;
      }
      if (isFamilyView) {
        return (
          contact.category !== "vendor" && contact.category !== "financial"
        );
      }
      return true; // Managers see all contacts
    });
  }, [contacts, isGuestView, isFamilyView]);

  // Memoized contact groups
  const contactGroups = useMemo(
    () => ({
      emergency: filteredContacts.filter((c) => c.category === "emergency"),
      property: filteredContacts.filter(
        (c) =>
          c.category === "property" ||
          c.category === "maintenance" ||
          c.category === "service"
      ),
      vendor: filteredContacts.filter(
        (c) => c.category === "vendor" || c.category === "contractor"
      ),
    }),
    [filteredContacts]
  );

  // Retry function
  const retryFetch = useCallback(() => {
    if (currentProperty?.id) {
      hasFetchedRef.current = null;
      fetchingRef.current = false;
      setError(null);
      fetchContacts(currentProperty.id);
    }
  }, [currentProperty?.id, fetchContacts]);

  // Memoized ContactCard component
  const ContactCard = useCallback(
    ({ contact }: { contact: Contact }) => {
      const categoryInfo = getCategoryInfo(contact.category);

      return (
        <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow relative group">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-lg pr-2">
                {contact.name}
              </h3>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded flex-shrink-0">
                {categoryInfo.icon} {categoryInfo.name}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              {contact.email && (
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                  <a
                    href={`mailto:${contact.email}`}
                    className="hover:text-blue-600 truncate"
                  >
                    {contact.email}
                  </a>
                </div>
              )}

              {contact.phone && (
                <div className="flex items-center text-gray-600">
                  <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                  <a
                    href={`tel:${contact.phone}`}
                    className="hover:text-blue-600"
                  >
                    {contact.phone}
                  </a>
                </div>
              )}

              {contact.address && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{contact.address}</span>
                </div>
              )}
            </div>

            {contact.notes && (
              <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {contact.notes}
                </p>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-500">
                Added{" "}
                {new Date(contact.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              {(isManagerView || isFamilyView) && (
                <Link
                  href={`/contacts/edit/${contact.id}`}
                  className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Link>
              )}
            </div>
          </div>
        </div>
      );
    },
    [getCategoryInfo, isManagerView, isFamilyView]
  );

  // Memoized EmptyState component
  const EmptyState = useCallback(
    ({
      title,
      description,
      buttonText,
      category,
    }: {
      title: string;
      description: string;
      buttonText: string;
      category?: string;
    }) => (
      <div className="text-center py-8 text-gray-500">
        <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="font-medium">{title}</p>
        <p className="text-sm mt-1 mb-4">{description}</p>
        {(isManagerView || isFamilyView) && (
          <Link
            href={`/contacts/add${category ? `?category=${category}` : ""}`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            {buttonText}
          </Link>
        )}
      </div>
    ),
    [isManagerView, isFamilyView]
  );

  // Loading states
  if (isLoading) {
    return (
      <PropertyGuard>
        <StandardPageLayout>
          <StandardCard
            title="Loading Contacts"
            subtitle="Please wait while we load your contact information"
          >
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">⏳ Loading contacts...</p>
            </div>
          </StandardCard>
        </StandardPageLayout>
      </PropertyGuard>
    );
  }

  if (!currentProperty) {
    return (
      <PropertyGuard>
        <StandardPageLayout>
          <StandardCard
            title="No Property Selected"
            subtitle="Please select a property to view contacts"
          >
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-600 mb-4">
                Contacts will appear once your property is loaded.
              </p>
              <Link
                href="/account/properties"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Select Property
              </Link>
            </div>
          </StandardCard>
        </StandardPageLayout>
      </PropertyGuard>
    );
  }

  // Error state
  if (error) {
    return (
      <PropertyGuard>
        <StandardPageLayout>
          <StandardCard
            title="Error Loading Contacts"
            subtitle="There was a problem loading your contacts"
          >
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-red-300 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={retryFetch}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </StandardCard>
        </StandardPageLayout>
      </PropertyGuard>
    );
  }

  return (
    <PropertyGuard>
      <StandardPageLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Contacts</h1>
              <p className="text-gray-600 mt-1">
                Property: <strong>{currentProperty.name}</strong>
                {filteredContacts.length > 0 && (
                  <span className="ml-2 text-sm">
                    ({filteredContacts.length} contact
                    {filteredContacts.length !== 1 ? "s" : ""})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Emergency contacts always visible */}
          <StandardCard
            title="Emergency Contacts"
            subtitle="Always know who to call in case of an emergency"
          >
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : contactGroups.emergency.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contactGroups.emergency.map((contact) => (
                  <ContactCard key={contact.id} contact={contact} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No emergency contacts found"
                description="Add emergency contacts for quick access during urgent situations"
                buttonText="Add Emergency Contact"
                category="emergency"
              />
            )}
          </StandardCard>

          {/* Property contacts for family+ */}
          {!isGuestView && (
            <StandardCard
              title="Property Contacts"
              subtitle="Contacts related to your property"
            >
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : contactGroups.property.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {contactGroups.property.map((contact) => (
                    <ContactCard key={contact.id} contact={contact} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No property contacts found"
                  description="Add contacts for property management, maintenance, and services"
                  buttonText="Add Property Contact"
                  category="property"
                />
              )}
            </StandardCard>
          )}

          {/* Vendor contacts for managers only */}
          {isManagerView && (
            <StandardCard
              title="Vendors & Services"
              subtitle="Contacts for vendors and service providers"
            >
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : contactGroups.vendor.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {contactGroups.vendor.map((contact) => (
                    <ContactCard key={contact.id} contact={contact} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No vendor contacts found"
                  description="Add contacts for vendors, contractors, and service providers"
                  buttonText="Add Vendor Contact"
                  category="vendor"
                />
              )}
            </StandardCard>
          )}
        </div>

        {/* Floating Action Button */}
        {(isManagerView || isFamilyView) && (
          <div className="fixed bottom-6 right-6 z-50">
            <FloatingActionButton
              icon={Plus}
              label="Add Contact"
              href="/contacts/add"
              variant="primary"
            />
          </div>
        )}
      </StandardPageLayout>
    </PropertyGuard>
  );
}
