"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Users, Plus, Phone, Mail, MapPin, Edit } from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/auth";
import { supabase } from "@/lib/supabase";
import ContactFilters from "@/components/contacts/ContactFilters";

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  category: string;
  address?: string;
  notes?: string;
  created_at: string;
}

export default function ContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: "maintenance", name: "Maintenance", icon: "🔧" },
    { id: "emergency", name: "Emergency", icon: "🚨" },
    { id: "vendor", name: "Vendor", icon: "🏪" },
    { id: "guest", name: "Guest", icon: "👤" },
    { id: "contractor", name: "Contractor", icon: "👷" },
    { id: "service", name: "Service", icon: "🛠️" },
  ];

  useEffect(() => {
    async function fetchContacts() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("contacts")
          .select("*")
          .order("name");

        if (error) throw error;
        setContacts(data as Contact[]);
        setFilteredContacts(data as Contact[]);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        // Demo data for testing
        const demoContacts = [
          {
            id: "1",
            name: "John's Plumbing",
            email: "john@plumbing.com",
            phone: "(555) 123-4567",
            category: "maintenance",
            address: "123 Main St, City, ST 12345",
            notes: "Available 24/7 for emergencies",
            created_at: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Emergency Services",
            phone: "911",
            category: "emergency",
            notes: "Police, Fire, Medical",
            created_at: new Date().toISOString(),
          },
          {
            id: "3",
            name: "ABC Cleaning Service",
            email: "info@abccleaning.com",
            phone: "(555) 987-6543",
            category: "service",
            address: "456 Oak Ave, City, ST 12345",
            created_at: new Date().toISOString(),
          },
        ];
        setContacts(demoContacts);
        setFilteredContacts(demoContacts);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchContacts();
    }
  }, [user]);

  const getCategoryInfo = (categoryId: string) => {
    return (
      categories.find((cat) => cat.id === categoryId) || {
        name: categoryId,
        icon: "👤",
      }
    );
  };

  return (
    <StandardPageLayout
      title="Contacts"
      subtitle="Manage property contacts and vendors"
      headerIcon={<Users className="h-6 w-6 text-blue-600" />}
      headerActions={
        <Link
          href="/contacts/add"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Link>
      }
    >
      {/* Contact Filters */}
      <ContactFilters
        contacts={contacts}
        setFilteredContacts={setFilteredContacts}
      />

      {/* Contacts Grid */}
      <StandardCard
        title={`${filteredContacts.length} Contact${
          filteredContacts.length !== 1 ? "s" : ""
        }`}
        subtitle="Browse your property contacts and vendors"
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredContacts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.map((contact) => {
              const categoryInfo = getCategoryInfo(contact.category);

              return (
                <div
                  key={contact.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow relative group"
                >
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
                        {new Date(contact.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                      <Link
                        href={`/contacts/edit/${contact.id}`}
                        className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p>No contacts found</p>
            <p className="text-sm mt-1 mb-4">
              Try adjusting your filters or add new contacts
            </p>
            <Link
              href="/contacts/add"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Contact
            </Link>
          </div>
        )}
      </StandardCard>
    </StandardPageLayout>
  );
}
