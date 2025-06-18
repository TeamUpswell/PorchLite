import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { ActionButton } from "@/components/ui/Icons";

interface ContactFormProps {
  contact?: {
    id: string;
    name: string;
    role: string;
    phone?: string;
    email?: string;
    address?: string;
    description?: string;
    website?: string;
    priority?: number;
  } | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ContactForm({
  contact,
  onClose,
  onSaved,
}: ContactFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    address: "",
    description: "",
    website: "",
    priority: 0,
  });
  const [roles, setRoles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [showNewRole, setShowNewRole] = useState(false);

  // Load existing roles
  useEffect(() => {
    const fetchRoles = async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("role")
        .order("role");

      if (!error && data) {
        const uniqueRoles = Array.from(new Set(data.map((item) => item.role)));
        setRoles(uniqueRoles);
      }
    };

    fetchRoles();
  }, []);

  // Load contact data if editing
  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        role: contact.role,
        phone: contact.phone || "",
        email: contact.email || "",
        address: contact.address || "",
        description: contact.description || "",
        website: contact.website || "",
        priority: contact.priority || 0,
      });
    }
  }, [contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const finalRole = showNewRole ? newRole : formData.role;

      const contactData = {
        name: formData.name,
        role: finalRole,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
        description: formData.description || null,
        website: formData.website || null,
        priority: formData.priority || 0,
        property_id: "00000000-0000-0000-0000-000000000000", // Default property ID
      };

      if (contact) {
        // Update existing contact
        await supabase
          .from("contacts")
          .update(contactData)
          .eq("id", contact.id);
      } else {
        // Create new contact
        await supabase.from("contacts").insert([
          {
            ...contactData,
            created_by: user.id,
          },
        ]);
      }

      onSave();
    } catch (error) {
      console.error("Error saving contact:", error);
      alert("Failed to save contact. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg h-auto max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">
            {contact ? "Edit Contact" : "Add New Contact"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
            title="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div
          className="overflow-y-auto p-4"
          style={{ maxHeight: "calc(90vh - 70px)" }}
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-full">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Name*
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Contact name"
                  required
                />
              </div>

              <div className="col-span-full">
                <label
                  htmlFor="role-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Role*
                </label>

                {showNewRole ? (
                  <div>
                    <input
                      type="text"
                      id="role-new"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="New role name"
                      title="New role name"
                      required
                    />
                    <div className="mt-2">
                      <button
                        type="button"
                        className="text-sm text-blue-600"
                        onClick={() => setShowNewRole(false)}
                      >
                        Use existing role
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <select
                      id="role-select"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required={!showNewRole}
                      title="Select a role"
                      aria-label="Role selection"
                    >
                      <option value="">Select a role</option>
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>

                    <div className="mt-2">
                      <button
                        type="button"
                        className="text-sm text-blue-600"
                        onClick={() => setShowNewRole(true)}
                      >
                        Create new role
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-1">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Phone number"
                />
              </div>

              <div className="col-span-1">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Email address"
                />
              </div>

              <div className="col-span-full">
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Street address"
                />
              </div>

              <div className="col-span-full">
                <label
                  htmlFor="website"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Website
                </label>
                <input
                  type="text"
                  id="website"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Website URL"
                />
              </div>

              <div className="col-span-full">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Additional notes or description"
                  rows={3}
                />
              </div>

              <div className="col-span-1">
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Priority (0-10)
                </label>
                <input
                  type="number"
                  id="priority"
                  min="0"
                  max="10"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : contact
                  ? "Update"
                  : "Add Contact"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
