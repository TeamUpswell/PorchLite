"use client";

import { useViewMode } from "@/lib/hooks/useViewMode";
import { useProperty } from "@/lib/hooks/useProperty";
import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Phone,
  Mail,
  MapPin,
  Edit,
  Globe,
  Search,
  Filter,
  Star,
  Clock,
  Building,
  Crown,
  Wrench,
  AlertTriangle,
  ExternalLink,
  Eye,
  X,
} from "lucide-react";
import Link from "next/link";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/auth";
import { supabase } from "@/lib/supabase";
import AddContactModal from "@/components/modals/AddContactModal";
import FloatingActionButton from "@/components/ui/FloatingActionButton";

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  address?: string;
  description?: string;
  website?: string;
  priority?: number;
  created_at: string;
  property_id?: string;
}

export default function ContactsPage() {
  const { user } = useAuth();
  const {
    currentProperty: property,
    currentTenant,
    loading: propertyLoading,
    error,
  } = useProperty();
  const { isManagerView, isFamilyView, isGuestView } = useViewMode();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null); // ✅ For details modal

  // ✅ Enhanced categories following dashboard color standards
  const categories = [
    {
      id: "owner",
      name: "Owner",
      icon: "👑",
      color: "bg-yellow-100 text-yellow-800",
      priority: 1,
    },
    {
      id: "emergency",
      name: "Emergency",
      icon: "🚨",
      color: "bg-red-100 text-red-800",
      priority: 2,
    },
    {
      id: "maintenance",
      name: "Maintenance",
      icon: "🔧",
      color: "bg-purple-100 text-purple-800",
      priority: 3,
    },
    {
      id: "management",
      name: "Management",
      icon: "🏢",
      color: "bg-blue-100 text-blue-800",
      priority: 4,
    },
    {
      id: "utility",
      name: "Utility",
      icon: "⚡",
      color: "bg-orange-100 text-orange-800",
      priority: 5,
    },
    {
      id: "neighbor",
      name: "Neighbor",
      icon: "🏠",
      color: "bg-green-100 text-green-800",
      priority: 6,
    },
    {
      id: "general",
      name: "General",
      icon: "📋",
      color: "bg-gray-100 text-gray-800",
      priority: 7,
    },
  ];

  // ✅ Define fetchContacts function first
  const fetchContacts = async () => {
    if (!property?.id || !user) return;

    try {
      setLoading(true);
      console.log("📞 Fetching contacts for property:", property.id);

      const { data, error } = await supabase
        .from("contacts")
        .select(
          "id, name, email, phone, role, address, description, website, priority, created_at, property_id"
        )
        .eq("property_id", property.id)
        .order("priority", { ascending: true })
        .limit(50);

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      console.log("📞 Found contacts:", data?.length || 0);

      const hasOwnerContact = data?.some(
        (contact) => contact.role === "owner" || contact.email === user.email
      );

      let allContacts = data as Contact[];

      // Auto-create owner contact if needed
      if (!hasOwnerContact && currentTenant?.role === "owner") {
        console.log("📞 Adding owner contact for user:", user.email);

        const ownerContact = {
          property_id: property.id,
          name:
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "Property Owner",
          email: user.email,
          phone: user.user_metadata?.phone || user.phone || null,
          role: "owner",
          description: "Property Owner & Manager",
          priority: 1,
          created_by: user.id,
        };

        const { data: insertedContact, error: insertError } = await supabase
          .from("contacts")
          .insert([ownerContact])
          .select()
          .single();

        if (insertError) {
          console.error("❌ Failed to insert owner contact:", insertError);
          // Fallback to memory-only contact
          allContacts.unshift({
            id: `owner-${user.id}`,
            name: ownerContact.name,
            email: ownerContact.email,
            phone: ownerContact.phone,
            role: "owner",
            description: "Property Owner & Manager",
            priority: 1,
            created_at: new Date().toISOString(),
            property_id: property.id,
          } as Contact);
        } else {
          console.log("✅ Owner contact added:", insertedContact);
          allContacts.unshift(insertedContact as Contact);
        }
      }

      // Sort by priority, then by name
      allContacts.sort((a, b) => {
        if (a.priority !== b.priority) {
          return (a.priority || 99) - (b.priority || 99);
        }
        return a.name.localeCompare(b.name);
      });

      setContacts(allContacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      // Graceful fallback for owner
      if (currentTenant?.role === "owner") {
        const ownerContact: Contact = {
          id: `owner-${user.id}`,
          name:
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "Property Owner",
          email: user.email || "",
          phone: user.user_metadata?.phone || user.phone || undefined,
          role: "owner",
          description: "Property Owner & Manager",
          priority: 1,
          created_at: new Date().toISOString(),
          property_id: property?.id || "",
        };
        setContacts([ownerContact]);
      } else {
        setContacts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Add refreshContacts function
  const refreshContacts = async () => {
    console.log("🔄 Refreshing contacts...");
    await fetchContacts();
  };

  // ✅ useEffect to fetch contacts on mount
  useEffect(() => {
    fetchContacts();
  }, [property?.id, user?.id, user?.email, currentTenant?.role]);

  // ✅ Filter contacts with performance optimization
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone?.includes(searchTerm);
    const matchesCategory =
      selectedCategory === "all" || contact.role === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // ✅ Get user avatar helper
  const getUserAvatar = (contact: Contact) => {
    if (contact.role === "owner" && contact.email === user?.email) {
      return user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
    }
    return null;
  };

  // ✅ Loading state with Header
  if (propertyLoading) {
    return (
      <ProtectedPageWrapper>
        <Header title="Contacts" />
        <PageContainer>
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading property...</p>
            </div>
          </div>
        </PageContainer>
      </ProtectedPageWrapper>
    );
  }

  // ✅ Error boundary with Header
  if (error || !property?.id || !currentTenant) {
    return (
      <ProtectedPageWrapper>
        <Header title="Contacts" />
        <PageContainer>
          <div className="text-center py-8">
            <div className="max-w-md mx-auto">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {error ? "Error Loading Property" : "No Property Access"}
              </h3>
              <p className="text-gray-600 mb-4">
                {error
                  ? error
                  : "You don't have access to this property or no property is selected."}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </PageContainer>
      </ProtectedPageWrapper>
    );
  }

  // ✅ Contact Details Modal Component
  const ContactDetailsModal = ({
    contact,
    onClose,
  }: {
    contact: Contact | null;
    onClose: () => void;
  }) => {
    if (!contact) return null;

    const category = categories.find((c) => c.id === contact.role);
    const avatarUrl = getUserAvatar(contact);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={contact.name}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-yellow-400"
                    />
                  ) : (
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        category?.color || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <span className="text-2xl">{category?.icon || "👤"}</span>
                    </div>
                  )}
                  {contact.priority && contact.priority <= 2 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <Star className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {contact.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        category?.color || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {category?.name || contact.role}
                    </span>
                    {contact.role === "owner" && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Contact Details */}
          <div className="p-6 space-y-4">
            {contact.phone && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Phone className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {contact.phone}
                  </a>
                </div>
              </div>
            )}

            {contact.email && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-500">Email</p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-blue-600 hover:text-blue-700 font-medium truncate block"
                    title={contact.email}
                  >
                    {contact.email}
                  </a>
                </div>
              </div>
            )}

            {contact.website && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Website</p>
                  <a
                    href={
                      contact.website.startsWith("http")
                        ? contact.website
                        : `https://${contact.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    Visit Website
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}

            {contact.address && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-gray-900 leading-relaxed">
                    {contact.address}
                  </p>
                </div>
              </div>
            )}

            {contact.description && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500 mb-2">Description</p>
                <p className="text-gray-900 leading-relaxed">
                  {contact.description}
                </p>
              </div>
            )}

            <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>
                  Added {new Date(contact.created_at).toLocaleDateString()}
                </span>
              </div>
              {contact.priority && contact.priority <= 3 && (
                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                  High Priority
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-100 pt-4 flex gap-3">
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                >
                  Call
                </a>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center font-medium"
                >
                  Email
                </a>
              )}
              {isManagerView && (
                <Link
                  href={`/contacts/${contact.id}/edit`}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <Header title="Contacts" />
      <PageContainer>
        <div className="space-y-6">
          {/* Property header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-xl">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900">
                      {property.name}
                    </h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {currentTenant.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {filteredContacts.length} contact
                      {filteredContacts.length !== 1 ? "s" : ""} • Property
                      Directory
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ✅ Compact Contact Cards */}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <StandardCard key={i} className="p-4">
                  <div className="animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded mb-1"></div>
                        <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded"></div>
                  </div>
                </StandardCard>
              ))}
            </div>
          ) : filteredContacts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredContacts.map((contact) => {
                const category = categories.find((c) => c.id === contact.role);
                const avatarUrl = getUserAvatar(contact);

                return (
                  <StandardCard
                    key={contact.id}
                    className="p-4 hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500"
                    onClick={() => setSelectedContact(contact)} // ✅ Click to view details
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={contact.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-yellow-400"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              category?.color || "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <span className="text-lg">
                              {category?.icon || "👤"}
                            </span>
                          </div>
                        )}
                        {contact.priority && contact.priority <= 2 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <Star className="h-2 w-2 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate text-sm">
                          {contact.name}
                        </h3>
                        <div className="flex items-center gap-1">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              category?.color || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {category?.name || contact.role}
                          </span>
                          {contact.role === "owner" && (
                            <Crown className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-gray-400" />
                        {isManagerView && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click
                              // Navigate to edit page
                              window.location.href = `/contacts/${contact.id}/edit`;
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors rounded"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ✅ Compact contact info preview */}
                    <div className="space-y-1 text-xs text-gray-600">
                      {contact.phone && (
                        <div className="flex items-center gap-2 truncate">
                          <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{contact.phone}</span>
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                    </div>
                  </StandardCard>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <StandardCard className="text-center py-16">
              <div className="max-w-md mx-auto">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No contacts found
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || selectedCategory !== "all"
                    ? "Try adjusting your search terms or filter settings."
                    : "Add contacts for this property to keep important information organized and easily accessible."}
                </p>
                {(searchTerm || selectedCategory !== "all") && (
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setSearchTerm("")}
                      className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Clear Search
                    </button>
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Clear Filter
                    </button>
                  </div>
                )}
              </div>
            </StandardCard>
          )}
        </div>

        {/* Floating Action Button */}
        {isManagerView && (
          <div className="fixed bottom-6 right-6 z-50">
            <FloatingActionButton
              icon={Plus}
              label="Add Contact"
              onClick={() => setShowAddModal(true)}
              variant="primary"
            />
          </div>
        )}

        {/* Add Contact Modal */}
        <AddContactModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onContactAdded={refreshContacts} // ✅ Now this function exists!
          propertyId={property.id}
          userId={user.id}
        />

        {/* ✅ Contact Details Modal */}
        <ContactDetailsModal
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      </PageContainer>
    </div>
  );
}
