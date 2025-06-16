"use client";

import { useViewMode } from "@/lib/hooks/useViewMode";
import { useState, useEffect } from "react";
import { Users, Phone, Mail, MapPin, Edit, Plus } from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import { PropertyGuard } from "@/components/ui/PropertyGuard";

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

export default function ContactsPage() {
  const { user } = useAuth();
  const { currentProperty } = useProperty();
  const { isManagerView, isFamilyView, isGuestView } = useViewMode();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('🔍 CONTACTS CLEAN VERSION:', {
    user: user?.email,
    currentProperty: currentProperty?.name,
    propertyId: currentProperty?.id,
    hasUser: !!user,
    hasProperty: !!currentProperty
  });

  const categories = [
    { id: "maintenance", name: "Maintenance", icon: "🔧" },
    { id: "emergency", name: "Emergency", icon: "🚨" },
    { id: "vendor", name: "Vendor", icon: "🏪" },
    { id: "guest", name: "Guest", icon: "👤" },
    { id: "contractor", name: "Contractor", icon: "👷" },
    { id: "service", name: "Service", icon: "🛠️" },
    { id: "property", name: "Property", icon: "🏠" },
  ];

  useEffect(() => {
    async function fetchContacts() {
      if (!currentProperty) {
        console.log('📞 No property selected, skipping contact fetch');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('📞 Fetching contacts for property:', currentProperty.id);
        
        const { data, error } = await supabase
          .from("contacts")
          .select("*")
          .eq('property_id', currentProperty.id)
          .order("name");

        if (error) throw error;
        
        console.log('📞 Found contacts:', data?.length);
        setContacts(data as Contact[]);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        
        // Demo data for testing (with property_id)
        const demoContacts = [
          {
            id: "1",
            name: "John's Plumbing",
            email: "john@plumbing.com",
            phone: "(555) 123-4567",
            category: "maintenance",
            address: "123 Main St, City, ST 12345",
            notes: "Available 24/7 for emergencies",
            property_id: currentProperty.id,
            created_at: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Emergency Services",
            phone: "911",
            category: "emergency",
            notes: "Police, Fire, Medical",
            property_id: currentProperty.id,
            created_at: new Date().toISOString(),
          },
          {
            id: "3",
            name: "ABC Cleaning Service",
            email: "info@abccleaning.com",
            phone: "(555) 987-6543",
            category: "service",
            address: "456 Oak Ave, City, ST 12345",
            property_id: currentProperty.id,
            created_at: new Date().toISOString(),
          },
        ];
        setContacts(demoContacts);
      } finally {
        setLoading(false);
      }
    }

    if (user && currentProperty) {
      fetchContacts();
    }
  }, [user, currentProperty]);

  const getCategoryInfo = (categoryId: string) => {
    return (
      categories.find((cat) => cat.id === categoryId) || {
        name: categoryId,
        icon: "👤",
      }
    );
  };

  // Filter contacts based on view mode
  const filteredContacts = contacts.filter((contact) => {
    if (isGuestView) {
      return contact.category === "emergency" || contact.is_public;
    }
    if (isFamilyView) {
      return contact.category !== "vendor" && contact.category !== "financial";
    }
    return true; // Managers see all contacts
  });

  // Show loading state if waiting for property
  if (!currentProperty) {
    return (
      <StandardPageLayout>
        <StandardCard
          title="Loading Property"
          subtitle="Please wait while we load your property information"
        >
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading property information...</p>
            <p className="text-sm text-gray-500 mt-2">
              Contacts will appear once your property is loaded.
            </p>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  const ContactCard = ({ contact }: { contact: Contact }) => {
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
                className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  const EmptyState = ({ 
    title, 
    description, 
    buttonText, 
    category 
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
          href={`/contacts/add${category ? `?category=${category}` : ''}`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          {buttonText}
        </Link>
      )}
    </div>
  );

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
            ) : filteredContacts.filter((c) => c.category === "emergency").length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContacts
                  .filter((c) => c.category === "emergency")
                  .map((contact) => (
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
              ) : filteredContacts.filter((c) => 
                  c.category === "property" || 
                  c.category === "maintenance" || 
                  c.category === "service"
                ).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredContacts
                    .filter((c) => 
                      c.category === "property" || 
                      c.category === "maintenance" || 
                      c.category === "service"
                    )
                    .map((contact) => (
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
              ) : filteredContacts.filter((c) => 
                  c.category === "vendor" || 
                  c.category === "contractor"
                ).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredContacts
                    .filter((c) => 
                      c.category === "vendor" || 
                      c.category === "contractor"
                    )
                    .map((contact) => (
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