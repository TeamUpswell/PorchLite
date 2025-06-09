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
} from "lucide-react";
import Link from "next/link";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import PageContainer from "@/components/layout/PageContainer";
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

  // ✅ Optimized fetchContacts with proper loading guards
  useEffect(() => {
    async function fetchContacts() {
      if (!property?.id || !user || loading) return;

      try {
        setLoading(true);
        console.log("📞 Fetching contacts for property:", property.id);

        // ✅ Select specific columns for performance
        const { data, error } = await supabase
          .from("contacts")
          .select(
            "id, name, email, phone, role, address, description, website, priority, created_at, property_id"
          )
          .eq("property_id", property.id)
          .order("priority", { ascending: true })
          .limit(50); // Limit for performance

        if (error) {
          console.error("Database error:", error);
          throw error;
        }

        console.log("📞 Found contacts:", data?.length || 0);

        const hasOwnerContact = data?.some(
          (contact) => contact.role === "owner" || contact.email === user.email
        );

        let allContacts = data as Contact[];

        // ✅ Auto-create owner contact if needed
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
    }

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

  // ✅ Loading state with consistent design
  if (propertyLoading) {
    return (
      <ProtectedPageWrapper>
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

  // ✅ Error boundary with retry
  if (error || !property?.id || !currentTenant) {
    return (
      <ProtectedPageWrapper>
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

  // Add this function to refresh contacts after adding:
  const refreshContacts = () => {
    // Trigger the useEffect to refetch contacts
    setContacts([]);
    // The useEffect will automatically refetch when contacts is empty
  };

  return (
    <ProtectedPageWrapper>
      <PageContainer>
        <div className="space-y-6">
          {/* ✅ Minimal Header Design */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-xl">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {property.name}
                    </h1>
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

          {/* ✅ Search and Filter Bar */}
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

          {/* ✅ Loading Skeletons */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <StandardCard key={i} className="p-6">
                  <div className="animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </StandardCard>
              ))}
            </div>
          ) : (
            <>
              {/* ✅ Contact Cards Grid */}
              {filteredContacts.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredContacts.map((contact) => {
                    const category = categories.find(
                      (c) => c.id === contact.role
                    );
                    const avatarUrl = getUserAvatar(contact);

                    return (
                      <StandardCard
                        key={contact.id}
                        className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 flex-1">
                            {/* ✅ Avatar or Icon */}
                            <div className="relative">
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt={contact.name}
                                  className="w-12 h-12 rounded-full object-cover ring-2 ring-yellow-400"
                                />
                              ) : (
                                <div
                                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                    category?.color ||
                                    "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  <span className="text-xl">
                                    {category?.icon || "👤"}
                                  </span>
                                </div>
                              )}

                              {/* Priority indicator */}
                              {contact.priority && contact.priority <= 2 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                  <Star className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {contact.name}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    category?.color ||
                                    "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {category?.name || contact.role}
                                </span>
                                {contact.role === "owner" && (
                                  <Crown className="h-3 w-3 text-yellow-500" />
                                )}
                              </div>
                            </div>
                          </div>

                          {isManagerView && (
                            <Link
                              href={`/contacts/${contact.id}/edit`}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          )}
                        </div>

                        {/* ✅ Contact Information */}
                        <div className="space-y-3">
                          {contact.phone && (
                            <div className="flex items-center gap-3">
                              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <a
                                href={`tel:${contact.phone}`}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                {contact.phone}
                              </a>
                            </div>
                          )}

                          {contact.email && (
                            <div className="flex items-center gap-3">
                              <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <a
                                href={`mailto:${contact.email}`}
                                className="text-blue-600 hover:text-blue-700 font-medium truncate"
                                title={contact.email}
                              >
                                {contact.email}
                              </a>
                            </div>
                          )}

                          {contact.website && (
                            <div className="flex items-center gap-3">
                              <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
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
                                Website
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}

                          {contact.address && (
                            <div className="flex items-start gap-3">
                              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                              <p className="text-gray-600 text-sm leading-relaxed">
                                {contact.address}
                              </p>
                            </div>
                          )}

                          {contact.description && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <p className="text-gray-600 text-sm leading-relaxed">
                                {contact.description}
                              </p>
                            </div>
                          )}

                          {/* ✅ Footer with timestamp and priority */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock className="h-3 w-3" />
                              <span>
                                {new Date(
                                  contact.created_at
                                ).toLocaleDateString()}
                              </span>
                            </div>

                            {contact.priority && contact.priority <= 3 && (
                              <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                                High Priority
                              </span>
                            )}
                          </div>
                        </div>
                      </StandardCard>
                    );
                  })}
                </div>
              ) : (
                /* ✅ Enhanced Empty State */
                <StandardCard className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    {searchTerm || selectedCategory !== "all" ? (
                      <>
                        <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No contacts found
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Try adjusting your search terms or filter settings.
                        </p>
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
                      </>
                    ) : (
                      <>
                        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No contacts yet
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Add contacts for this property to keep important
                          information organized and easily accessible.
                        </p>
                      </>
                    )}
                  </div>
                </StandardCard>
              )}

              {/* ✅ Categories Overview Dashboard Widget Style */}
              {contacts.length > 0 && (
                <StandardCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <Building className="h-5 w-5 text-blue-600" />
                      Contact Categories
                    </h3>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categories.map((category) => {
                      const count = contacts.filter(
                        (c) => c.role === category.id
                      ).length;
                      return (
                        <div
                          key={category.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:scale-105 cursor-pointer ${
                            count > 0
                              ? "bg-blue-50 border-blue-200"
                              : "bg-gray-50 border-gray-200"
                          }`}
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          <span className="text-xl">{category.icon}</span>
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {category.name}
                            </span>
                            <p className="text-xs text-gray-500">
                              {count} contact
                              {count !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </StandardCard>
              )}
            </>
          )}
        </div>

        {/* ✅ Standard Floating Action Button Component */}
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

        <AddContactModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onContactAdded={refreshContacts}
          propertyId={property.id}
          userId={user.id}
        />
      </PageContainer>
    </ProtectedPageWrapper>
  );
}
