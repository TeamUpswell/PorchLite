"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useProperty } from "@/lib/hooks/useProperty";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import "@/styles/dashboard.css";
import {
  Calendar,
  AlertTriangle,
  CheckCircle,
  Package,
  Cloud,
  Wrench,
  Users,
  ChevronRight,
  Thermometer,
  Wind,
  Eye,
  Clock,
  Home as HomeIcon,
  Wifi,
  Zap,
  Droplets,
  Shield,
  MapPin,
  Phone,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";
import ResponsiveImage from "@/components/ResponsiveImage";
import { convertToWebP, supportsWebP } from "@/lib/imageUtils";
import PropertyDebug from "@/components/PropertyDebug";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

// Define interfaces for our new dashboard data
interface Issue {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "maintenance" | "cleaning" | "inventory" | "safety";
  description: string;
  created_at: string;
  status: "open" | "in_progress" | "resolved";
}

interface UpcomingVisit {
  id: string;
  title: string;
  guest_name?: string;
  start_date: string;
  end_date: string;
  guests?: number;
  status: "confirmed" | "pending" | "cancelled" | "requested";
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  type?: string;
}

interface InventoryItem {
  id: string;
  name: string;
  current_stock: number;
  min_stock: number;
  category: "essentials" | "cleaning" | "amenities" | "maintenance";
  last_restocked: string;
  status: "good" | "low" | "critical";
}

interface WeatherData {
  current: {
    temp: number;
    condition: string;
    humidity: number;
    wind_speed: number;
    icon: string;
  };
  forecast: Array<{
    date: string;
    high: number;
    low: number;
    condition: string;
    icon: string;
  }>;
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { currentProperty, properties, switchProperty } = useProperty();

  // State for dashboard content
  const [upcomingVisits, setUpcomingVisits] = useState<UpcomingVisit[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryItem[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<Issue[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAddReservationModal, setShowAddReservationModal] = useState(false);

  // REMOVE THE REDIRECT - This was causing the loop!
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login"); // Only redirect to login if not authenticated
    }
    // REMOVED: router.push("/dashboard") - this was the problem!
  }, [user, loading, router]);

  // Fetch upcoming visits/reservations
  useEffect(() => {
    async function fetchUpcomingVisits() {
      if (!currentProperty) return;

      try {
        const today = new Date().toISOString();
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const nextMonthStr = nextMonth.toISOString();

        console.log(
          "🔍 Fetching reservations for property:",
          currentProperty.id
        );
        console.log("Date range:", today, "to", nextMonthStr);

        // Query with correct column names from your schema
        const { data: visits, error } = await supabase
          .from("reservations")
          .select(
            `
            id,
            title,
            description,
            start_date,
            end_date,
            guests,
            companion_count,
            status,
            user_id,
            created_at,
            reservation_companions (
              name,
              email,
              phone,
              relationship
            )
          `
          )
          .eq("property_id", currentProperty.id)
          .gte("start_date", today)
          .lte("start_date", nextMonthStr)
          .order("start_date", { ascending: true })
          .limit(10);

        console.log("Raw reservations data:", visits);
        console.log("Query error:", error);

        if (error) {
          console.error("Error fetching reservations:", error);
          setUpcomingVisits([]);
          return;
        }

        // Format the data to match your interface
        const formattedVisits =
          visits?.map((v) => {
            // Get primary companion info (first companion or fallback)
            const primaryCompanion = v.reservation_companions?.[0];
            const totalGuests = (v.guests || 0) + (v.companion_count || 0);

            return {
              id: v.id,
              title:
                v.title ||
                `Reservation - ${new Date(v.start_date).toLocaleDateString()}`,
              guest_name: primaryCompanion?.name || v.title || "Guest",
              start_date: v.start_date,
              end_date: v.end_date,
              guests: totalGuests || 1,
              status: v.status || "pending",
              contact_email: primaryCompanion?.email || "",
              contact_phone: primaryCompanion?.phone || "",
              notes: v.description || "",
              type: "reservation",
            };
          }) || [];

        console.log("Formatted visits:", formattedVisits);
        setUpcomingVisits(formattedVisits);
      } catch (error) {
        console.error("Error fetching upcoming visits:", error);
        setUpcomingVisits([]);
      }
    }

    fetchUpcomingVisits();
  }, [currentProperty]);

  // Fetch inventory alerts
  useEffect(() => {
    async function fetchInventoryAlerts() {
      if (!currentProperty) return;

      try {
        const { data: inventory, error } = await supabase
          .from("inventory")
          .select("*")
          .eq("property_id", currentProperty.id)
          .or("quantity.lte.threshold") // ✅ Fixed: was "current_stock.lte.min_stock"
          .order("category");

        if (error) throw error;

        const alerts =
          inventory
            ?.map((item) => ({
              ...item,
              current_stock: item.quantity, // ✅ Map for interface compatibility
              min_stock: item.threshold, // ✅ Map for interface compatibility
              status:
                item.quantity <= 0 // ✅ Fixed: was current_stock
                  ? ("critical" as const)
                  : item.quantity <= item.threshold // ✅ Fixed: was current_stock/min_stock
                  ? ("low" as const)
                  : ("good" as const),
            }))
            .filter((item) => item.status !== "good") || [];

        setInventoryAlerts(alerts);
      } catch (error) {
        console.error("Error fetching inventory:", error);
        // Create some example data if table doesn't exist
        setInventoryAlerts([
          {
            id: "1",
            name: "Toilet Paper",
            current_stock: 2,
            min_stock: 6,
            category: "essentials",
            last_restocked: "2024-01-15",
            status: "low",
          },
          {
            id: "2",
            name: "Coffee",
            current_stock: 0,
            min_stock: 2,
            category: "amenities",
            last_restocked: "2024-01-10",
            status: "critical",
          },
        ]);
      }
    }

    fetchInventoryAlerts();
  }, [currentProperty]);

  // Fetch maintenance alerts
  useEffect(() => {
    async function fetchMaintenanceAlerts() {
      if (!currentProperty) return;

      try {
        const { data: issues, error } = await supabase
          .from("cleaning_issues") // ✅ Fixed: was "property_issues"
          .select("*")
          .eq("property_id", currentProperty.id)
          .eq("status", "open")
          .eq("category", "maintenance") // Add this filter if needed
          .order("severity", { ascending: false });

        if (error) throw error;
        setMaintenanceAlerts(issues || []);
      } catch (error) {
        console.error("Error fetching maintenance alerts:", error);
      }
    }

    fetchMaintenanceAlerts();
  }, [currentProperty]);

  // Fetch weather data
  useEffect(() => {
    async function fetchWeather() {
      if (!currentProperty?.latitude || !currentProperty?.longitude) {
        // Show fallback weather for now
        setWeather({
          current: {
            temp: 72,
            condition: "Partly cloudy",
            humidity: 65,
            wind_speed: 8,
            icon: "02d",
          },
          forecast: [
            {
              date: "2024-05-25",
              high: 75,
              low: 60,
              condition: "Sunny",
              icon: "01d",
            },
            {
              date: "2024-05-26",
              high: 73,
              low: 58,
              condition: "Cloudy",
              icon: "03d",
            },
            {
              date: "2024-05-27",
              high: 68,
              low: 55,
              condition: "Rain",
              icon: "10d",
            },
          ],
        });
        return;
      }

      try {
        const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

        if (!API_KEY) {
          console.log("Weather API key not configured");
          return;
        }

        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${currentProperty.latitude}&lon=${currentProperty.longitude}&appid=${API_KEY}&units=imperial`;
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();

          setWeather({
            current: {
              temp: Math.round(data.list[0].main.temp),
              condition: data.list[0].weather[0].description,
              humidity: data.list[0].main.humidity,
              wind_speed: Math.round(data.list[0].wind.speed),
              icon: data.list[0].weather[0].icon,
            },
            forecast: data.list.slice(1, 6).map((item: any) => ({
              date: item.dt_txt.split(" ")[0],
              high: Math.round(item.main.temp_max),
              low: Math.round(item.main.temp_min),
              condition: item.weather[0].description,
              icon: item.weather[0].icon,
            })),
          });
        } else {
          console.error("Weather API error:", response.status);
        }
      } catch (error) {
        console.error("Error fetching weather:", error);
      }
    }

    fetchWeather();
  }, [currentProperty]);

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentProperty) {
      toast.error("Please select a property first");
      return;
    }

    if (!file.type.match(/image\/(jpeg|jpg|png|webp|gif)/i)) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let fileToUpload = file;
      let fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";

      const webpSupported = await supportsWebP();
      if (webpSupported) {
        const optimizedBlob = await convertToWebP(file, 1920, 0.85);
        fileToUpload = new File([optimizedBlob], `property.webp`, {
          type: "image/webp",
        });
        fileExt = "webp";
      }

      const fileName = `property-${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("properties")
        .upload(filePath, fileToUpload, {
          cacheControl: "31536000",
          upsert: true,
        });

      setUploadProgress(100);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("properties")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("properties")
        .update({ main_photo_url: publicUrlData.publicUrl })
        .eq("id", currentProperty.id);

      if (updateError) throw updateError;

      toast.success("Property image updated successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null; // Will redirect to login
  }

  // No property selected
  if (!currentProperty) {
    return (
      <StandardPageLayout>
        <div className="container mx-auto p-8 text-center">
          <div className="max-w-md mx-auto">
            <HomeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Property Selected
            </h2>
            <p className="text-gray-600 mb-6">
              Please select a property from the dropdown to view your dashboard.
            </p>
            <Link
              href="/properties/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Property
            </Link>
          </div>
        </div>
      </StandardPageLayout>
    );
  }

  // Main dashboard - REMOVE the title prop to remove header
  return (
    <StandardPageLayout>
      {/* Your entire dashboard content here - no title prop = no header */}
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Property Hero Header with Weather Overlay */}
        <DashboardHeader>
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">
              Welcome to {currentProperty?.name || "Your Property"}
            </h1>

            {/* Weather Info */}
            {weather && (
              <div className="flex items-center justify-center space-x-4 text-lg">
                <div className="flex items-center">
                  <Thermometer className="h-5 w-5 mr-1" />
                  <span>{Math.round(weather.current.temp)}°F</span>
                </div>
                <div className="flex items-center">
                  <Wind className="h-5 w-5 mr-1" />
                  <span>{Math.round(weather.current.wind_speed)} mph</span>
                </div>
                <div className="capitalize">{weather.current.condition}</div>
              </div>
            )}
          </div>
        </DashboardHeader>

        {/* Two Column Dashboard Grid (Weather removed from here) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Column 1 - Upcoming Visits */}
          <div className="space-y-6">
            {/* Enhanced Upcoming Visits Section */}
            <section className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center text-gray-900">
                  <Calendar className="h-6 w-6 text-blue-600 mr-2" />
                  Upcoming Reservations
                </h2>
                <div className="flex space-x-2">
                  <Link
                    href="/calendar"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Calendar
                  </Link>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={() => setShowAddReservationModal(true)}
                  className="flex items-center justify-center p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </button>
                <Link
                  href="/calendar?filter=pending"
                  className="flex items-center justify-center p-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-medium"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Pending
                </Link>
                <Link
                  href="/calendar"
                  className="flex items-center justify-center p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Manage
                </Link>
              </div>

              {upcomingVisits.length > 0 ? (
                <div className="space-y-3">
                  {upcomingVisits.map((visit) => {
                    const startDate = new Date(visit.start_date);
                    const endDate = new Date(visit.end_date);
                    const isToday =
                      startDate.toDateString() === new Date().toDateString();
                    const isThisWeek =
                      Math.ceil(
                        (startDate.getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) <= 7;
                    const daysUntil = Math.ceil(
                      (startDate.getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    );

                    return (
                      <div
                        key={visit.id}
                        className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                          isToday
                            ? "border-blue-500 bg-blue-50"
                            : isThisWeek
                            ? "border-orange-200 bg-orange-25"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 ${
                                visit.status === "confirmed"
                                  ? "bg-green-100"
                                  : visit.status === "pending"
                                  ? "bg-yellow-100"
                                  : visit.status === "requested"
                                  ? "bg-blue-100"
                                  : "bg-gray-100"
                              }`}
                            >
                              <Users
                                className={`h-6 w-6 ${
                                  visit.status === "confirmed"
                                    ? "text-green-600"
                                    : visit.status === "pending"
                                    ? "text-yellow-600"
                                    : visit.status === "requested"
                                    ? "text-blue-600"
                                    : "text-gray-600"
                                }`}
                              />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {visit.title}
                              </h3>
                              {visit.guest_name &&
                                visit.guest_name !== visit.title && (
                                  <p className="text-sm text-gray-600">
                                    {visit.guest_name}
                                  </p>
                                )}
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>
                                  {startDate.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year:
                                      startDate.getFullYear() !==
                                      new Date().getFullYear()
                                        ? "numeric"
                                        : undefined,
                                  })}{" "}
                                  -{" "}
                                  {endDate.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year:
                                      endDate.getFullYear() !==
                                      new Date().getFullYear()
                                        ? "numeric"
                                        : undefined,
                                  })}
                                </span>
                                <span>
                                  {visit.guests} guest
                                  {visit.guests !== 1 ? "s" : ""}
                                </span>
                              </div>

                              {/* Time-based indicators */}
                              <div className="flex items-center space-x-2 mt-1">
                                {isToday && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                    Today
                                  </span>
                                )}
                                {daysUntil > 0 &&
                                  daysUntil <= 7 &&
                                  !isToday && (
                                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                                      {daysUntil} day
                                      {daysUntil !== 1 ? "s" : ""}
                                    </span>
                                  )}
                                {daysUntil < 0 && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                    In Progress
                                  </span>
                                )}
                              </div>

                              {/* Contact info */}
                              {(visit.contact_email || visit.contact_phone) && (
                                <div className="mt-1 text-xs text-gray-500">
                                  {visit.contact_email && (
                                    <div className="flex items-center">
                                      <span>📧 {visit.contact_email}</span>
                                    </div>
                                  )}
                                  {visit.contact_phone && (
                                    <div className="flex items-center">
                                      <Phone className="h-3 w-3 mr-1" />
                                      <span>{visit.contact_phone}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end space-y-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                visit.status === "confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : visit.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : visit.status === "requested"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {visit.status}
                            </span>

                            {/* Quick Actions */}
                            <div className="flex space-x-1">
                              <Link
                                href={`/calendar/${visit.id}/edit`}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit reservation"
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                              <Link
                                href={`/calendar/${visit.id}`}
                                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            </div>
                          </div>
                        </div>

                        {visit.notes && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                            <strong>Notes:</strong> {visit.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-700 mb-3">No upcoming reservations</p>
                  <div className="space-y-2">
                    <Link
                      href="/calendar/new"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Reservation
                    </Link>
                    <br />
                    <Link
                      href="/calendar"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Calendar
                    </Link>
                  </div>
                </div>
              )}

              {/* Summary Footer */}
              {upcomingVisits.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>
                      {
                        upcomingVisits.filter((v) => v.status === "confirmed")
                          .length
                      }{" "}
                      confirmed,{" "}
                      {
                        upcomingVisits.filter((v) => v.status === "pending")
                          .length
                      }{" "}
                      pending
                    </span>
                    <Link
                      href="/calendar"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View All →
                    </Link>
                  </div>
                </div>
              )}
            </section>

            {/* Quick Actions */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Link
                  href="/issues/new"
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <AlertTriangle className="h-5 w-5 text-orange-500 mr-3" />
                  <span className="font-medium text-gray-900">
                    Report Issue
                  </span>
                  <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                </Link>
                <Link
                  href="/reservations/new"
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Calendar className="h-5 w-5 text-blue-500 mr-3" />
                  <span className="font-medium text-gray-900">
                    Add Reservation
                  </span>
                  <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                </Link>
                <Link
                  href="/inventory/add"
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Package className="h-5 w-5 text-green-500 mr-3" />
                  <span className="font-medium text-gray-900">
                    Update Inventory
                  </span>
                  <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                </Link>
                <Link
                  href="/maintenance/schedule"
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Wrench className="h-5 w-5 text-orange-500 mr-3" />
                  <span className="font-medium text-gray-900">
                    Schedule Maintenance
                  </span>
                  <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                </Link>
              </div>
            </section>
          </div>

          {/* Column 2 - Inventory & Maintenance */}
          <div className="space-y-6">
            {/* Inventory Alerts */}
            <section className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center text-gray-900">
                  <Package className="h-6 w-6 text-green-600 mr-2" />
                  Inventory Status
                </h2>
                <Link
                  href="/inventory"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All
                </Link>
              </div>

              {inventoryAlerts.length > 0 ? (
                <div className="space-y-3">
                  {inventoryAlerts.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        item.status === "critical"
                          ? "border-l-red-400 bg-red-50"
                          : "border-l-yellow-400 bg-yellow-50"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4
                            className={`font-medium ${
                              item.status === "critical"
                                ? "text-red-900"
                                : "text-yellow-900"
                            }`}
                          >
                            {item.name}
                          </h4>
                          <p
                            className={`text-sm ${
                              item.status === "critical"
                                ? "text-red-800"
                                : "text-yellow-800"
                            }`}
                          >
                            {item.current_stock} / {item.min_stock} minimum
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            item.status === "critical"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  <Link
                    href="/inventory/restock"
                    className="block w-full text-center py-2 bg-blue-600 hover:bg-blue-700 transition-colors font-medium"
                    style={{ color: "#ffffff" }}
                  >
                    Create Shopping List
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-700">
                    All essentials are well stocked!
                  </p>
                  <Link
                    href="/inventory"
                    className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block font-medium"
                  >
                    Manage inventory
                  </Link>
                </div>
              )}
            </section>

            {/* Maintenance Alerts */}
            {maintenanceAlerts.length > 0 && (
              <section className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center text-gray-900">
                    <Wrench className="h-6 w-6 text-orange-600 mr-2" />
                    Maintenance Alerts
                  </h2>
                  <Link
                    href="/maintenance"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View All
                  </Link>
                </div>

                <div className="space-y-3">
                  {maintenanceAlerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 border-l-4 border-l-orange-400 bg-orange-50"
                    >
                      <div>
                        <h4 className="font-medium text-orange-900">
                          {alert.title}
                        </h4>
                        <p className="text-sm text-orange-800">
                          {alert.description}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          alert.severity === "critical"
                            ? "bg-red-100 text-red-800"
                            : alert.severity === "high"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Quick Add Reservation Modal */}
        {showAddReservationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Quick Add Reservation
                  </h3>
                  <button
                    onClick={() => setShowAddReservationModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Quick reservation form */}
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Guest Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter guest name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Check-in
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Check-out
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Guests
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="1"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddReservationModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add Reservation
                    </button>
                  </div>

                  <Link
                    href="/calendar/new"
                    className="block text-center text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => setShowAddReservationModal(false)}
                  >
                    Need more options? Use full form →
                  </Link>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info - Development Only */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 p-4 bg-gray-100 rounded">
            <h3>Debug Info:</h3>
            <p>Current Property: {currentProperty?.id}</p>
            <p>Visits Found: {upcomingVisits.length}</p>
            <pre className="text-xs mt-2 overflow-auto">
              {JSON.stringify(upcomingVisits, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </StandardPageLayout>
  );
}
