"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Building,
  Plus,
  Trash2,
  Edit,
  AlertTriangle,
  Home,
} from "lucide-react";
import { useRouter } from "next/navigation";
import StandardCard from "@/components/ui/StandardCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { PropertyGuard } from "@/components/ui/PropertyGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

interface CreatePropertyForm {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  description: string;
}

export default function PropertiesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    currentProperty,
    userProperties,
    loading: propertyLoading,
    refreshProperties,
    setCurrentProperty,
  } = useProperty();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CreatePropertyForm>({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    description: "",
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    variant: "danger",
  });

  // Refs for optimization
  const mountedRef = useRef(true);
  const creatingRef = useRef(false);

  // Component cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Memoized loading state
  const isInitializing = useMemo(() => {
    return authLoading || propertyLoading;
  }, [authLoading, propertyLoading]);

  // Form validation
  const isCreateFormValid = useMemo(() => {
    return (
      createForm.name.trim().length > 0 &&
      createForm.address.trim().length > 0 &&
      createForm.city.trim().length > 0 &&
      createForm.state.trim().length > 0 &&
      createForm.zip.trim().length > 0
    );
  }, [createForm]);

  // Memoized form change handler
  const handleCreateFormChange = useCallback(
    (field: keyof CreatePropertyForm) => {
      return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!mountedRef.current) return;

        setCreateForm((prev) => ({ ...prev, [field]: e.target.value }));

        // Clear error when user starts typing
        if (error) {
          setError(null);
        }
      };
    },
    [error]
  );

  // Show confirmation dialog
  const showConfirmation = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      variant: "danger" | "warning" | "info" = "danger"
    ) => {
      setConfirmDialog({
        isOpen: true,
        title,
        message,
        onConfirm,
        variant,
      });
    },
    []
  );

  // Close confirmation dialog
  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Create property handler
  const handleCreateProperty = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      // Prevent duplicate creates
      if (
        creatingRef.current ||
        creating ||
        !mountedRef.current ||
        !isCreateFormValid
      ) {
        return;
      }

      if (!user?.id) {
        setError("User not authenticated");
        return;
      }

      creatingRef.current = true;
      setCreating(true);
      setError(null);

      try {
        console.log("🏠 Creating new property...");

        const { data, error } = await supabase
          .from("properties")
          .insert([
            {
              name: createForm.name.trim(),
              address: createForm.address.trim(),
              city: createForm.city.trim(),
              state: createForm.state.trim(),
              zip: createForm.zip.trim(),
              description: createForm.description.trim() || null,
              created_by: user.id,
            },
          ])
          .select()
          .single();

        if (!mountedRef.current) {
          console.log("⚠️ Component unmounted, aborting");
          return;
        }

        if (error) {
          console.error("❌ Error creating property:", error);
          setError(error.message || "Failed to create property");
          toast.error("Failed to create property");
        } else {
          console.log("✅ Property created successfully:", data.name);
          toast.success("Property created successfully!");

          // Reset form and close modal
          setCreateForm({
            name: "",
            address: "",
            city: "",
            state: "",
            zip: "",
            description: "",
          });
          setShowCreateForm(false);

          // Refresh properties and set as current
          await refreshProperties();
          if (data) {
            setCurrentProperty(data);
          }
        }
      } catch (error) {
        console.error("❌ Unexpected error creating property:", error);
        if (mountedRef.current) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to create property";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (mountedRef.current) {
          setCreating(false);
        }
        creatingRef.current = false;
      }
    },
    [
      createForm,
      user?.id,
      creating,
      isCreateFormValid,
      refreshProperties,
      setCurrentProperty,
    ]
  );

  // Delete property handler
  const handleDeleteProperty = useCallback(
    (property_id: string) => {
      const property = userProperties.find((p) => p.id === property_id);

      if (!property) {
        toast.error("Property not found");
        return;
      }

      // Check if user owns the property
      if (property.created_by !== user?.id) {
        toast.error("You don't have permission to delete this property");
        return;
      }

      showConfirmation(
        "Delete Property",
        `Are you sure you want to delete "${property.name}"? This will permanently delete all associated data including manual items, notes, and photos. This action cannot be undone.`,
        async () => {
          if (!mountedRef.current) return;

          setDeletingId(property_id);

          try {
            console.log("🗑️ Deleting property:", property.name);

            const { error } = await supabase
              .from("properties")
              .delete()
              .eq("id", property_id)
              .eq("created_by", user?.id); // Additional security check

            if (!mountedRef.current) {
              console.log("⚠️ Component unmounted, aborting");
              return;
            }

            if (error) {
              console.error("❌ Error deleting property:", error);
              toast.error("Failed to delete property");
            } else {
              console.log("✅ Property deleted successfully");
              toast.success("Property deleted successfully");

              // If deleted property was current, clear it
              if (currentProperty?.id === property_id) {
                setCurrentProperty(null);
              }

              await refreshProperties();
            }
          } catch (error) {
            console.error("❌ Unexpected error deleting property:", error);
            if (mountedRef.current) {
              toast.error("Failed to delete property");
            }
          } finally {
            if (mountedRef.current) {
              setDeletingId(null);
            }
          }
        },
        "danger"
      );
    },
    [
      userProperties,
      user?.id,
      currentProperty,
      showConfirmation,
      setCurrentProperty,
      refreshProperties,
    ]
  );

  // Cancel create form
  const handleCancelCreate = useCallback(() => {
    if (creating) return; // Don't allow cancel while creating

    setCreateForm({
      name: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      description: "",
    });
    setShowCreateForm(false);
    setError(null);
  }, [creating]);

  // Navigate to edit page
  const handleEditProperty = useCallback(
    (property_id: string) => {
      router.push(`/properties/${property_id}/edit`);
    },
    [router]
  );

  // Set as current property
  const handleSetCurrent = useCallback(
    (property: any) => {
      setCurrentProperty(property);
      toast.success(`Switched to ${property.name}`);
    },
    [setCurrentProperty]
  );

  // Loading state
  if (isInitializing) {
    return (
      <PropertyGuard>
        <StandardCard>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600">⏳ Loading properties...</p>
            </div>
          </div>
        </StandardCard>
      </PropertyGuard>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <PropertyGuard>
      <div className="space-y-6">
        <StandardCard
          title="Your Properties"
          subtitle={`Manage and organize your properties • ${userProperties.length} ${
            userProperties.length === 1 ? "property" : "properties"
          }`}
          headerActions={
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </button>
          }
        >
          <div className="space-y-4">
            {userProperties.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-lg">
                <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No properties found
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your first property to get started managing your
                  rental portfolio.
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Property
                </button>
              </div>
            ) : (
              userProperties.map((property) => (
                <div
                  key={property.id}
                  className={`border rounded-lg p-6 transition-all ${
                    currentProperty?.id === property.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {property.name}
                        </h3>
                        {currentProperty?.id === property.id && (
                          <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Home className="h-3 w-3 mr-1" />
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">
                        {property.address}
                        {property.city && `, ${property.city}`}
                        {property.state && `, ${property.state}`}
                        {property.zip && ` ${property.zip}`}
                      </p>
                      {property.description && (
                        <p className="text-sm text-gray-500 mb-3">
                          {property.description}
                        </p>
                      )}
                      <div className="flex items-center text-xs text-gray-500">
                        <span>
                          Created{" "}
                          {new Date(property.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {currentProperty?.id !== property.id && (
                        <button
                          onClick={() => handleSetCurrent(property)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          Set Current
                        </button>
                      )}
                      <button
                        onClick={() => handleEditProperty(property.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit property"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProperty(property.id)}
                        disabled={deletingId === property.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 transition-colors"
                        title="Delete property"
                      >
                        {deletingId === property.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </StandardCard>

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={closeConfirmDialog}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          variant={confirmDialog.variant}
        />

        {/* Create Property Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Create New Property
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Add a new property to your portfolio
                </p>
              </div>

              <form onSubmit={handleCreateProperty} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Name *
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={handleCreateFormChange("name")}
                    disabled={creating}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    placeholder="e.g., 123 Main Street Apartment"
                    maxLength={100}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={createForm.address}
                    onChange={handleCreateFormChange("address")}
                    disabled={creating}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    placeholder="123 Main Street"
                    maxLength={200}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={createForm.city}
                      onChange={handleCreateFormChange("city")}
                      disabled={creating}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                      placeholder="City"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      value={createForm.state}
                      onChange={handleCreateFormChange("state")}
                      disabled={creating}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                      placeholder="State"
                      maxLength={50}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    value={createForm.zip}
                    onChange={handleCreateFormChange("zip")}
                    disabled={creating}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    placeholder="12345"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={handleCreateFormChange("description")}
                    disabled={creating}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    placeholder="Optional description or notes about this property"
                    maxLength={500}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancelCreate}
                    disabled={creating}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !isCreateFormValid}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Property
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PropertyGuard>
  );
}