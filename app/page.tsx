"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth";
import { useRouter } from "next/navigation";
import { useProperty } from "@/lib/hooks/useProperty";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import "@/styles/dashboard.css";
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  CheckCircle,
  Plus,
  ShoppingCart,
  Cloud,
  Wrench,
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
  X,
  Camera,
  ChevronRight, // ✅ Add this missing import
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";
import ResponsiveImage from "@/components/ResponsiveImage";
import { convertToWebP, supportsWebP } from "@/lib/imageUtils";
import PropertyDebug from "@/components/PropertyDebug";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AuthenticatedLayout from "@/components/auth/AuthenticatedLayout";

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
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [userUploadedBanners, setUserUploadedBanners] = useState<
    Array<{
      id: string;
      url: string;
      name: string;
      uploaded_at: string;
    }>
  >([]);
  const [bannersLoaded, setBannersLoaded] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [totalInventoryCount, setTotalInventoryCount] = useState(0);

  // Add this state for predefined images:
  const [predefinedImages] = useState([
    {
      id: "beach-house",
      name: "Beach House",
      url: "/images/headers/presets/beach-house.jpg",
      thumbnail: "/images/headers/presets/thumbs/beach-house-thumb.jpg",
      category: "Beach",
    },
    {
      id: "city-apartment",
      name: "City Apartment",
      url: "/images/headers/presets/city-apartment.jpg",
      thumbnail: "/images/headers/presets/thumbs/city-apartment-thumb.jpg",
      category: "Urban",
    },
    {
      id: "modern-house",
      name: "Modern House",
      url: "/images/headers/presets/modern-house.jpg",
      thumbnail: "/images/headers/presets/thumbs/modern-house-thumb.jpg",
      category: "Modern",
    },
    {
      id: "cozy-cabin",
      name: "Cozy Cabin",
      url: "/images/headers/presets/cozy-cabin.jpg",
      thumbnail: "/images/headers/presets/thumbs/cozy-cabin-thumb.jpg",
      category: "Rustic",
    },
  ]);

  // ALL YOUR useEffect HOOKS GO HERE - DON'T MOVE THESE
  // Handle redirect after early return
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  // Fetch upcoming visits/reservations - with proper guard
  useEffect(() => {
    async function fetchUpcomingVisits() {
      if (!currentProperty?.id) return;

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
      } finally {
        setIsFetching(false);
      }
    }

    fetchUpcomingVisits();
  }, [currentProperty?.id]);

  // Fetch inventory alerts - ADD PROPER DEPENDENCIES
  useEffect(() => {
    const fetchInventoryAlerts = async () => {
      if (!currentProperty?.id || isFetching) return;

      setIsFetching(true);
      try {
        console.log(
          "🔍 Fetching inventory alerts for property:",
          currentProperty.id
        );

        // ✅ Get all items first
        const { data, error } = await supabase
          .from("inventory")
          .select("*")
          .eq("property_id", currentProperty.id)
          .eq("is_active", true)
          .order("category", { ascending: true });

        if (error) {
          console.error("Error fetching inventory:", error);
          return;
        }

        console.log("📦 Raw inventory data:", data);

        // ✅ Set total count
        setTotalInventoryCount(data?.length || 0);

        // ✅ Use EXACT same logic as inventory page - only explicit status
        const alerts =
          data?.filter((item) => {
            // Only check explicit status - no automatic threshold logic
            return item.status === "low" || item.status === "out";
          }) || [];

        console.log("🚨 Filtered alerts (explicit status only):", alerts);
        setInventoryAlerts(alerts);
      } catch (error) {
        console.error("Error fetching inventory:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchInventoryAlerts();
  }, [currentProperty?.id]);

  // Fetch maintenance alerts - ADD PROPER DEPENDENCIES
  useEffect(() => {
    async function fetchMaintenanceAlerts() {
      if (!currentProperty?.id || isFetching) return;

      setIsFetching(true);
      try {
        const { data: issues, error } = await supabase
          .from("cleaning_issues")
          .select("*")
          .eq("property_id", currentProperty.id)
          .eq("status", "open")
          .eq("category", "maintenance")
          .order("severity", { ascending: false });

        if (error) throw error;
        setMaintenanceAlerts(issues || []);
      } catch (error) {
        console.error("Error fetching maintenance alerts:", error);
      } finally {
        setIsFetching(false);
      }
    }

    fetchMaintenanceAlerts();
  }, [currentProperty?.id]);

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

  // ALL YOUR FUNCTIONS GO HERE
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

  // Banner image upload handler
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        fileToUpload = new File([optimizedBlob], `banner.webp`, {
          type: "image/webp",
        });
        fileExt = "webp";
      }

      const fileName = `banner-${uuidv4()}.${fileExt}`;
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

      // ✅ FIX: Use header_image_url instead of banner_image
      const { error: updateError } = await supabase
        .from("properties")
        .update({ header_image_url: publicUrlData.publicUrl })
        .eq("id", currentProperty.id);

      if (updateError) throw updateError;

      toast.success("Banner image updated successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error uploading banner image:", error);
      toast.error("Failed to upload banner image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle banner removal
  const handleBannerRemove = async () => {
    if (!currentProperty) return;

    try {
      // ✅ FIX: Use header_image_url instead of banner_image
      const { error } = await supabase
        .from("properties")
        .update({ header_image_url: null })
        .eq("id", currentProperty.id);

      if (error) throw error;

      toast.success("Banner image removed successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error removing banner image:", error);
      toast.error("Failed to remove banner image. Please try again.");
    }
  };

  // Handle predefined banner selection
  const handlePredefinedBannerSelect = async (imageUrl: string) => {
    if (!currentProperty) return;

    try {
      // ✅ FIX: Use header_image_url instead of banner_image
      const { error } = await supabase
        .from("properties")
        .update({ header_image_url: imageUrl })
        .eq("id", currentProperty.id);

      if (error) throw error;

      toast.success("Banner updated successfully!");
      setShowBannerModal(false);
      window.location.reload();
    } catch (error) {
      console.error("Error updating banner:", error);
      toast.error("Failed to update banner");
    }
  };

  // Fetch user's previously uploaded banners
  const fetchUserBannersOnDemand = async () => {
    if (bannersLoaded || !currentProperty) return;

    setBannersLoaded(true);

    try {
      // Get all banner uploads for this property from storage
      const { data: files, error } = await supabase.storage
        .from("properties")
        .list("", {
          limit: 10, // ✅ Reduced from 50
          search: "banner-",
        });

      if (error) throw error;

      // Filter and format banner files
      const bannerFiles =
        files
          ?.filter((file) => file.name.startsWith("banner-"))
          ?.map((file) => {
            const { data: publicUrlData } = supabase.storage
              .from("properties")
              .getPublicUrl(file.name);

            return {
              id: file.name,
              url: publicUrlData.publicUrl,
              name: `Banner ${new Date(
                file.created_at || file.updated_at || Date.now()
              ).toLocaleDateString()}`,
              uploaded_at:
                file.created_at || file.updated_at || new Date().toISOString(),
            };
          })
          ?.sort(
            (a, b) =>
              new Date(b.uploaded_at).getTime() -
              new Date(a.uploaded_at).getTime()
          ) || [];

      setUserUploadedBanners(bannerFiles);
    } catch (error) {
      console.error("Error fetching user banners:", error);
    }
  };

  // Update the banner modal button:
  const openBannerModal = () => {
    setShowBannerModal(true);
    fetchUserBannersOnDemand(); // ✅ Only fetch when needed
  };

  // Task Overview component
  const TaskOverview = () => {
    const [taskStats, setTaskStats] = useState({
      open: 0,
      inProgress: 0,
      overdue: 0,
      completedToday: 0,
    });

    // ✅ ADD: Fetch real task data
    useEffect(() => {
      const fetchTaskStats = async () => {
        if (!currentProperty?.id) return;

        try {
          const today = new Date().toISOString().split("T")[0];

          const { data: tasks, error } = await supabase
            .from("tasks")
            .select("id, status, due_date, completed_at")
            .eq("property_id", currentProperty.id);

          if (error) throw error;

          const stats = {
            // ✅ Updated to match your actual status values
            open: tasks?.filter((t) => t.status === "pending").length || 0,
            inProgress:
              tasks?.filter((t) => t.status === "in_progress").length || 0,
            overdue:
              tasks?.filter(
                (t) =>
                  t.status !== "completed" &&
                  t.due_date &&
                  new Date(t.due_date) < new Date()
              ).length || 0,
            completedToday:
              tasks?.filter(
                (t) =>
                  t.status === "completed" && t.completed_at?.startsWith(today)
              ).length || 0,
          };

          setTaskStats(stats);
        } catch (error) {
          console.error("Error fetching task stats:", error);
        }
      };

      fetchTaskStats();
    }, [currentProperty]);

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Task Overview</h3>
          <Link
            href="/tasks"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View All →
          </Link>
        </div>

        {taskStats.open === 0 && taskStats.inProgress === 0 ? (
          // All clear state
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-green-700 font-medium mb-1">
              All Tasks Complete!
            </p>
            <p className="text-sm text-gray-500">
              Your property is in great shape
            </p>
          </div>
        ) : (
          // Task stats grid
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {taskStats.open}
              </div>
              <div className="text-sm text-orange-700">Open</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {taskStats.inProgress}
              </div>
              <div className="text-sm text-blue-700">In Progress</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {taskStats.overdue}
              </div>
              <div className="text-sm text-red-700">Overdue</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {taskStats.completedToday}
              </div>
              <div className="text-sm text-green-700">Done Today</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // NOW PUT THE EARLY RETURNS AT THE END - AFTER ALL HOOKS
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // No property selected
  if (!currentProperty) {
    return (
      <ProtectedPageWrapper>
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
      </ProtectedPageWrapper>
    );
  }

  // Main dashboard
  return (
    <ProtectedRoute>
      <ProtectedPageWrapper>
        <div className="flex-1 overflow-y-auto bg-gray-900 text-white">
          {/* REMOVE DashboardHeader - we're replacing it with our custom hero */}

          <div className="p-6">
            {/* Hero Section with Banner Image Background and Stats Overlay */}
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mb-6 text-white overflow-hidden min-h-[300px] group">
              {/* Banner Image Background - SAME AS BEFORE */}
              {(currentProperty?.header_image_url ||
                currentProperty?.main_photo_url) && (
                <div className="absolute inset-0">
                  <ResponsiveImage
                    src={
                      currentProperty.header_image_url ||
                      currentProperty.main_photo_url ||
                      ""
                    }
                    alt={`${currentProperty.name} banner`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    priority
                  />
                  {/* Gradient overlay - heavier at bottom for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-70"></div>
                </div>
              )}

              {/* Fallback gradient when no banner image - SAME AS BEFORE */}
              {!(
                currentProperty?.header_image_url ||
                currentProperty?.main_photo_url
              ) && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700"></div>
              )}

              {/* Banner Change Button - SAME AS BEFORE */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={openBannerModal}
                  className="flex items-center px-3 py-2 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg text-gray-900 hover:bg-opacity-100 transition-all shadow-lg text-sm font-medium"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Change Banner
                </button>
              </div>

              {/* Content Overlay - SMALLER TEXT AND STATS */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {/* Compact Header Section - SMALLER */}
                <div className="text-center mb-3">
                  <h1 className="text-xl sm:text-2xl font-bold mb-2 drop-shadow-lg text-white">
                    Welcome to {currentProperty?.name || "Your Property"}
                  </h1>

                  {/* Compact Weather Info - SMALLER */}
                  {weather && (
                    <div className="flex items-center justify-center space-x-3 text-xs flex-wrap gap-1">
                      <div className="flex items-center bg-white bg-opacity-20 backdrop-blur-sm rounded-md px-2 py-1 shadow-lg border border-white border-opacity-30">
                        <Thermometer className="h-3 w-3 mr-1 text-white" />
                        <span className="font-semibold text-white">
                          {Math.round(weather.current.temp)}°F
                        </span>
                      </div>
                      <div className="flex items-center bg-white bg-opacity-20 backdrop-blur-sm rounded-md px-2 py-1 shadow-lg border border-white border-opacity-30">
                        <Wind className="h-3 w-3 mr-1 text-white" />
                        <span className="font-semibold text-white">
                          {Math.round(weather.current.wind_speed)} mph
                        </span>
                      </div>
                      <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-md px-2 py-1 capitalize font-semibold shadow-lg border border-white border-opacity-30 text-white">
                        {weather.current.condition}
                      </div>
                    </div>
                  )}
                </div>

                {/* Compact Stats - MUCH SMALLER */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center bg-white bg-opacity-95 backdrop-blur-md rounded-lg p-2 shadow-xl border border-white border-opacity-50">
                    <div className="flex items-center justify-center mb-0.5">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {upcomingVisits.length}
                    </div>
                    <div className="text-xs font-medium text-gray-700">
                      Upcoming
                    </div>
                  </div>

                  <div className="text-center bg-white bg-opacity-95 backdrop-blur-md rounded-lg p-2 shadow-xl border border-white border-opacity-50">
                    <div className="flex items-center justify-center mb-0.5">
                      <Package className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {inventoryAlerts.length}
                    </div>
                    <div className="text-xs font-medium text-gray-700">
                      Low Stock
                    </div>
                  </div>

                  <div className="text-center bg-white bg-opacity-95 backdrop-blur-md rounded-lg p-2 shadow-xl border border-white border-opacity-50">
                    <div className="flex items-center justify-center mb-0.5">
                      <Wrench className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {maintenanceAlerts.length}
                    </div>
                    <div className="text-xs font-medium text-gray-700">
                      Issues
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Grid with dark cards */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
                          startDate.toDateString() ===
                          new Date().toDateString();
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
                                  {(visit.contact_email ||
                                    visit.contact_phone) && (
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
                      <p className="text-gray-700 mb-3">
                        No upcoming reservations
                      </p>
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
                            upcomingVisits.filter(
                              (v) => v.status === "confirmed"
                            ).length
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

                {/* ✅ ADD: Task Overview */}
                <TaskOverview />

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
                      Inventory Overview
                    </h2>
                    <Link
                      href="/inventory"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Manage All
                    </Link>
                  </div>

                  {/* Quick Stats Grid - Updated to work with actual data */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-700">
                        {/* ✅ Calculate well stocked using same logic as inventory page */}
                        {/* This should be a separate query or calculated differently */}
                        {totalInventoryCount - inventoryAlerts.length}
                      </div>
                      <div className="text-xs font-medium text-green-600">
                        Well Stocked
                      </div>
                    </div>

                    <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-700">
                        {/* ✅ Only explicit "low" status */}
                        {
                          inventoryAlerts.filter(
                            (item) => item.status === "low"
                          ).length
                        }
                      </div>
                      <div className="text-xs font-medium text-yellow-600">
                        Running Low
                      </div>
                    </div>

                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-2xl font-bold text-red-700">
                        {/* ✅ Only explicit "out" status */}
                        {
                          inventoryAlerts.filter(
                            (item) => item.status === "out"
                          ).length
                        }
                      </div>
                      <div className="text-xs font-medium text-red-600">
                        Out of Stock
                      </div>
                    </div>
                  </div>

                  {/* Items That Need Attention */}
                  {inventoryAlerts.length > 0 ? (
                    <div className="space-y-3 mb-6">
                      <h3 className="font-medium text-gray-900 text-sm">
                        Items Needing Attention
                      </h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {inventoryAlerts.slice(0, 6).map((item) => {
                          // ✅ Determine status based on actual data
                          const itemStatus =
                            item.quantity === 0 ? "critical" : "low";

                          return (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                itemStatus === "critical"
                                  ? "border-red-200 bg-red-50"
                                  : "border-yellow-200 bg-yellow-50"
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    itemStatus === "critical"
                                      ? "bg-red-500"
                                      : "bg-yellow-500"
                                  }`}
                                />
                                <div>
                                  <h4
                                    className={`font-medium text-sm ${
                                      itemStatus === "critical"
                                        ? "text-red-900"
                                        : "text-yellow-900"
                                    }`}
                                  >
                                    {item.name}
                                  </h4>
                                  <p
                                    className={`text-xs ${
                                      itemStatus === "critical"
                                        ? "text-red-700"
                                        : "text-yellow-700"
                                    }`}
                                  >
                                    {itemStatus === "critical"
                                      ? "Out of stock"
                                      : `${item.quantity} remaining (threshold: ${item.threshold})`}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  itemStatus === "critical"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {itemStatus === "critical" ? "🔴" : "⚠️"}
                              </span>
                            </div>
                          );
                        })}

                        {inventoryAlerts.length > 6 && (
                          <div className="text-center py-2">
                            <Link
                              href="/inventory"
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View {inventoryAlerts.length - 6} more items →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 mb-6">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-gray-700 font-medium">
                        All items are well stocked!
                      </p>
                      <p className="text-gray-500 text-sm">
                        Everything looks good right now.
                      </p>
                    </div>
                  )}

                  {/* Quick Action Buttons */}
                  <div className="flex space-x-3">
                    {/* Shopping List Button - Dynamic based on alerts */}
                    {inventoryAlerts.length > 0 ? (
                      <Link
                        href="/inventory?create-shopping-list=true"
                        className="flex-1 flex items-center justify-center py-3 px-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                      >
                        <ShoppingCart className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">
                          Create Shopping List
                        </span>
                        <span className="sm:hidden">List</span>
                        <span className="ml-1 sm:ml-2 bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                          {inventoryAlerts.length}
                        </span>
                      </Link>
                    ) : (
                      <Link
                        href="/inventory"
                        className="flex-1 flex items-center justify-center py-3 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
                      >
                        <Package className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">View Inventory</span>
                        <span className="sm:hidden">View</span>
                      </Link>
                    )}

                    {/* Quick Add Item Button */}
                    <Link
                      href="/inventory?add-item=true"
                      className="flex items-center justify-center py-3 px-3 sm:px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                      title="Add new item"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="ml-1 sm:hidden">Add</span>
                    </Link>
                  </div>

                  {/* Smart Recommendations */}
                  {inventoryAlerts.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start space-x-2">
                        <div className="flex-shrink-0">
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">💡</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900 text-sm">
                            Smart Tip
                          </h4>
                          <p className="text-blue-800 text-xs mt-1">
                            {inventoryAlerts.filter(
                              (item) => item.status === "critical"
                            ).length > 0
                              ? `You have ${
                                  inventoryAlerts.filter(
                                    (item) => item.status === "critical"
                                  ).length
                                } critical items. Consider creating a shopping list for your next trip.`
                              : `${inventoryAlerts.length} items are running low. Plan ahead to avoid running out.`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* Maintenance Alerts */}
                {maintenanceAlerts.length > 0 && (
                  <section className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      {" "}
                      {/* ✅ ADD this opening div */}
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
                    </div>{" "}
                    {/* ✅ ADD this closing div */}
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

            {/* Enhanced Banner Selection Modal */}
            {showBannerModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">
                        Change Banner Image
                      </h3>
                      <button
                        onClick={() => setShowBannerModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Upload Custom Image */}
                    <div className="mb-8">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Upload New Image
                      </h4>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp" // ✅ More specific
                          onChange={handleBannerUpload}
                          className="hidden"
                          id="banner-upload"
                          disabled={isUploading}
                        />
                        <label
                          htmlFor="banner-upload"
                          className={`cursor-pointer ${
                            isUploading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="mx-auto w-12 h-12 text-gray-400">
                              <Plus className="w-full h-full" />
                            </div>
                            <div>
                              <span className="text-lg font-medium text-gray-900">
                                {isUploading
                                  ? "Uploading..."
                                  : "Click to upload"}
                              </span>
                              <p className="text-sm text-gray-500">
                                PNG, JPG, WebP up to 5MB
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Recommended: 1920x600px or larger for best
                                results
                              </p>
                            </div>
                          </div>
                        </label>
                      </div>

                      {/* Upload Progress */}
                      {isUploading && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Uploading...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* User's Previously Uploaded Banners */}
                    {userUploadedBanners.length > 0 && (
                      <div className="mb-8">
                        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                          <Clock className="h-5 w-5 mr-2 text-blue-600" />
                          Your Previously Uploaded Banners
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {userUploadedBanners.map((banner) => (
                            <div
                              key={banner.id}
                              className="group relative cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-green-500 transition-all shadow-sm hover:shadow-md"
                              onClick={() =>
                                handlePredefinedBannerSelect(banner.url)
                              }
                            >
                              <div className="aspect-[16/9] relative">
                                <ResponsiveImage
                                  src={banner.url}
                                  alt={banner.name}
                                  fill
                                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                                />

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity"></div>

                                {/* Selection Button */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                                    <span className="text-sm font-medium text-gray-900">
                                      Select
                                    </span>
                                  </div>
                                </div>

                                {/* "Your Upload" Badge */}
                                <div className="absolute top-2 left-2">
                                  <span className="px-2 py-1 bg-green-600 bg-opacity-90 text-white text-xs rounded-md font-medium">
                                    Your Upload
                                  </span>
                                </div>

                                {/* Current Banner Indicator */}
                                {currentProperty?.header_image_url ===
                                  banner.url && (
                                  <div className="absolute top-2 right-2">
                                    <div className="bg-blue-600 text-white rounded-full p-1">
                                      <CheckCircle className="h-4 w-4" />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Banner Info */}
                              <div className="p-3 bg-white">
                                <h5 className="font-medium text-gray-900 text-sm text-center truncate">
                                  {banner.name}
                                </h5>
                                <p className="text-xs text-gray-500 text-center mt-1">
                                  {new Date(
                                    banner.uploaded_at
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Clear old banners option */}
                        <div className="mt-4 text-center">
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  "This will remove old banner files from storage (but keep the current one). Continue?"
                                )
                              ) {
                                // Add function to clean up old banners if needed
                              }
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            Clean up old banners
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Predefined Template Gallery */}
                    <div className="mb-8">
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                        <Package className="h-5 w-5 mr-2 text-purple-600" />
                        Template Gallery
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {predefinedImages.map((image) => (
                          <div
                            key={image.id}
                            className="group relative cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all shadow-sm hover:shadow-md"
                            onClick={() =>
                              handlePredefinedBannerSelect(image.url)
                            }
                          >
                            <div className="aspect-[16/9] relative">
                              <ResponsiveImage
                                src={image.thumbnail}
                                alt={image.name}
                                fill
                                className="object-cover transition-transform duration-200 group-hover:scale-105"
                              />

                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity"></div>

                              {/* Selection Button */}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                                  <span className="text-sm font-medium text-gray-900">
                                    Select
                                  </span>
                                </div>
                              </div>

                              {/* Template Badge */}
                              <div className="absolute top-2 left-2">
                                <span className="px-2 py-1 bg-purple-600 bg-opacity-90 text-white text-xs rounded-md font-medium">
                                  {image.category}
                                </span>
                              </div>

                              {/* Current Banner Indicator */}
                              {currentProperty?.header_image_url ===
                                image.url && (
                                <div className="absolute top-2 right-2">
                                  <div className="bg-blue-600 text-white rounded-full p-1">
                                    <CheckCircle className="h-4 w-4" />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Image Name */}
                            <div className="p-3 bg-white">
                              <h5 className="font-medium text-gray-900 text-sm text-center">
                                {image.name}
                              </h5>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Current Banner Preview & Remove Option */}
                    {(currentProperty?.header_image_url ||
                      currentProperty?.main_photo_url) && (
                      <div className="border-t border-gray-200 pt-6">
                        <h4 className="font-medium text-gray-900 mb-3">
                          Current Banner
                        </h4>
                        <div className="relative rounded-lg overflow-hidden border border-gray-200 max-w-md">
                          <div className="aspect-[16/6] relative">
                            <ResponsiveImage
                              src={
                                currentProperty.header_image_url ||
                                currentProperty.main_photo_url ||
                                ""
                              }
                              alt="Current banner"
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="absolute top-2 right-2">
                            <button
                              onClick={handleBannerRemove}
                              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors"
                              title="Remove banner"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 flex justify-center">
                          <button
                            onClick={handleBannerRemove}
                            className="px-4 py-2 text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Remove Current Banner
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => setShowBannerModal(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ProtectedPageWrapper>
    </ProtectedRoute>
  );
}
