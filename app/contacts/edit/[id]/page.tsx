"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import SideNavigation from "@/components/SideNavigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";

// Define proper type for page params
interface PageParams {
  params: {
    id: string;
  };
}

export default function EditContactPage({ params }: PageParams) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    role: "contractor",
    phone: "",
    email: "",
    address: "",
    description: "",
    website: "",
    priority: 0,
  });

  const contactId = params.id;

  useEffect(() => {
    async function fetchContact() {
      try {
        if (!contactId) return;

        const { data, error } = await supabase
          .from("contacts")
          .select("*")
          .eq("id", contactId)
          .single();

        if (error) throw error;

        if (data) {
          // Convert priority to number if it exists
          const priority = data.priority !== null ? parseInt(data.priority) : 0;

          setFormData({
            name: data.name || "",
            role: data.role || "contractor",
            phone: data.phone || "",
            email: data.email || "",
            address: data.address || "",
            description: data.description || "",
            website: data.website || "",
            priority: priority,
          });
        }
      } catch (error: unknown) {
        console.error("Error fetching contact:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load contact";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchContact();
  }, [contactId]);

  // Update the handleChange function with proper typing
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "priority" ? parseInt(value) || 0 : value,
    }));
  };

  // Update the handleSubmit function with proper typing
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Verify user is authenticated
      if (!user) {
        throw new Error("You must be logged in to update contacts");
      }

      // Add updated timestamp
      const contactData = {
        ...formData,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("contacts")
        .update(contactData)
        .eq("id", contactId);

      if (error) throw error;

      // Redirect back to contacts page on success
      router.push("/contacts");
      router.refresh();
    } catch (error: unknown) {
      console.error("Error updating contact:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update the handleDeleteContact function with proper error handling
  const handleDeleteContact = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", contactId);

      if (error) throw error;

      // Redirect back to contacts page on success
      router.push("/contacts");
      router.refresh();
    } catch (error: unknown) {
      console.error("Error deleting contact:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.name) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <SideNavigation user={user} />
        <div className="lg:pl-64 flex flex-col flex-1">
          <main className="flex-1 p-6">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SideNavigation user={user} />
      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center mb-6">
              <Link
                href="/contacts"
                className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </Link>
              <h1 className="text-2xl font-semibold">Edit Contact</h1>
            </div>

            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="max-w-2xl">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                      required
                      placeholder="Enter contact name"
                      aria-label="Contact name"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                      aria-label="Contact role"
                    >
                      <option value="contractor">Contractor</option>
                      <option value="plumber">Plumber</option>
                      <option value="electrician">Electrician</option>
                      <option value="handyman">Handyman</option>
                      <option value="landscaping">Landscaping</option>
                      <option value="cleaning">Cleaning</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter phone number"
                      aria-label="Contact phone number"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter email address"
                      aria-label="Contact email address"
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter website URL"
                      aria-label="Contact website"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter physical address"
                      aria-label="Contact address"
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Priority (0-10)
                    </label>
                    <input
                      type="number"
                      name="priority"
                      min="0"
                      max="10"
                      value={formData.priority}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Set priority level (0-10)"
                      aria-label="Contact priority level"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter description or notes"
                      aria-label="Contact description"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  {/* Left side - Delete button */}
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="inline-flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Contact
                  </button>

                  {/* Right side - Cancel and Update buttons */}
                  <div className="flex space-x-3">
                    <Link
                      href="/contacts"
                      className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {loading ? (
                        <span className="inline-flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Saving...
                        </span>
                      ) : (
                        <span className="inline-flex items-center">
                          <Save className="h-4 w-4 mr-2" />
                          Update Contact
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Delete Contact
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete {formData.name}? This action
              cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteContact}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              >
                {loading ? (
                  <span className="inline-flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  <>Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
