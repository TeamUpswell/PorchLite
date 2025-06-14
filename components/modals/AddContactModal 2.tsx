"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { X, Save, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactAdded: () => void;
  propertyId: string;
  userId: string;
}

export default function AddContactModal({
  isOpen,
  onClose,
  onContactAdded,
  propertyId,
  userId,
}: AddContactModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    role: "general",
    phone: "",
    email: "",
    address: "",
    description: "",
    website: "",
    priority: 5,
  });

  const roleOptions = [
    { value: "emergency", label: "🚨 Emergency" },
    { value: "maintenance", label: "🔧 Maintenance" },
    { value: "management", label: "🏢 Management" },
    { value: "utility", label: "⚡ Utility" },
    { value: "neighbor", label: "🏠 Neighbor" },
    { value: "general", label: "📋 General" },
  ];

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "priority" ? parseInt(value) || 5 : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const contactData = {
        ...formData,
        property_id: propertyId,
        created_by: userId,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("contacts")
        .insert([contactData]);

      if (error) throw error;

      // Reset form and close modal
      setFormData({
        name: "",
        role: "general",
        phone: "",
        email: "",
        address: "",
        description: "",
        website: "",
        priority: 5,
      });
      
      onContactAdded();
      onClose();
    } catch (error: unknown) {
      console.error("Error adding contact:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setError("");
      setFormData({
        name: "",
        role: "general",
        phone: "",
        email: "",
        address: "",
        description: "",
        website: "",
        priority: 5,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ✅ Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Add New Contact</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ✅ Modal Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Enter contact name"
                  disabled={loading}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority (1-10)
                </label>
                <input
                  type="number"
                  name="priority"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1 = highest priority"
                  disabled={loading}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="contact@example.com"
                  disabled={loading}
                />
              </div>

              {/* Website */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                  disabled={loading}
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Main Street, City, State ZIP"
                  disabled={loading}
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes or description..."
                  disabled={loading}
                />
              </div>
            </div>

            {/* ✅ Modal Actions */}
            <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Add Contact
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}