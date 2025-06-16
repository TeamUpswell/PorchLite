"use client";

import { useState, useEffect } from "react";
import { Building, Plus, Trash2, Edit } from "lucide-react";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { PropertyGuard } from "@/components/ui/PropertyGuard";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function YourPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    currentProperty,
    userProperties,
    loading: propertyLoading,
    refreshProperties,
  } = useProperty();

  const [showCreateForm, setShowCreateForm] = useState(false);
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

  const showConfirmation = (
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
  };

  const handleDeleteProperty = (propertyId: string) => {
    const property = userProperties.find((p) => p.id === propertyId);
    showConfirmation(
      "Delete Property",
      `Are you sure you want to delete "${property?.name}"? This action cannot be undone.`,
      async () => {
        try {
          const { error } = await supabase
            .from("properties")
            .delete()
            .eq("id", propertyId);

          if (error) throw error;

          await refreshProperties();
          toast.success("Property deleted successfully");
        } catch (error) {
          console.error("Error deleting property:", error);
          toast.error("Failed to delete property");
        }
      },
      "danger"
    );
  };

  if (authLoading || propertyLoading) {
    return (
      <div className="p-6">
        <Header />
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading...</span>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <PropertyGuard>
      <div className="p-6">
        <Header />
        <PageContainer>
          <div className="space-y-6">
            <StandardCard title="Properties" subtitle="Manage your properties">
              <div className="space-y-4">
                {userProperties.map((property) => (
                  <div key={property.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{property.name}</h3>
                        <p className="text-gray-600">{property.address}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {}}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit property"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProperty(property.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 flex items-center justify-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add New Property
                </button>
              </div>
            </StandardCard>
          </div>

          <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            onClose={() =>
              setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
            }
            onConfirm={confirmDialog.onConfirm}
            title={confirmDialog.title}
            message={confirmDialog.message}
            variant={confirmDialog.variant}
          />

          {showCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-lg font-medium mb-4">Create New Property</h2>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-700 border rounded"
                  >
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded">
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </PageContainer>
      </div>
    </PropertyGuard>
  );
}
