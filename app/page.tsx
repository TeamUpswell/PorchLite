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
import DashboardLayout from "@/components/dashboard/DashboardLayout";

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
  const [taskAlerts, setTaskAlerts] = useState<any[]>([]);
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

  // ✅ SEPARATE LOADING STATES for each fetch operation
  const [isVisitsFetching, setIsVisitsFetching] = useState(false);
  const [isInventoryFetching, setIsInventoryFetching] = useState(false);
  const [isTasksFetching, setIsTasksFetching] = useState(false);

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
      if (!currentProperty?.id || isVisitsFetching) return;

      setIsVisitsFetching(true);
      try {
        const today = new Date().toISOString();
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const nextMonthStr = nextMonth.toISOString();

        console.log(
          "🔍 Fetching reservations for property:",
          currentProperty.id
        );

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

        if (error) {
          console.error("Error fetching reservations:", error);
          setUpcomingVisits([]);
          return;
        }

        const formattedVisits =
          visits?.map((v) => {
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

        setUpcomingVisits(formattedVisits);
      } catch (error) {
        console.error("Error fetching upcoming visits:", error);
        setUpcomingVisits([]);
      } finally {
        setIsVisitsFetching(false);
      }
    }

    fetchUpcomingVisits();
  }, [currentProperty?.id]); // Only depend on property ID

  // Fetch inventory alerts - ADD PROPER DEPENDENCIES
  useEffect(() => {
    const fetchInventoryAlerts = async () => {
      if (!currentProperty?.id || isInventoryFetching) return;

      setIsInventoryFetching(true);
      try {
        console.log(
          "🔍 Fetching inventory alerts for property:",
          currentProperty.id
        );

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

        setTotalInventoryCount(data?.length || 0);

        const alerts =
          data?.filter((item) => {
            return item.status === "low" || item.status === "out";
          }) || [];

        setInventoryAlerts(alerts);
      } catch (error) {
        console.error("Error fetching inventory:", error);
      } finally {
        setIsInventoryFetching(false);
      }
    };

    fetchInventoryAlerts();
  }, [currentProperty?.id]); // Only depend on property ID

  // Fetch task alerts (replace the maintenance alerts useEffect)
  useEffect(() => {
    async function fetchTaskAlerts() {
      if (!currentProperty?.id || isTasksFetching) return; // ✅ Use isTasksFetching

      setIsTasksFetching(true); // ✅ Use isTasksFetching
      try {
        console.log("🔍 Fetching tasks for property:", currentProperty.id);

        const { data: tasks, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("property_id", currentProperty.id)
          .in("status", ["pending", "in_progress"])
          .order("priority", { ascending: false })
          .order("due_date", { ascending: true });

        if (error) {
          console.error("Error fetching tasks:", error);
          throw error;
        }

        console.log("✅ Loaded tasks:", tasks);
        setTaskAlerts(tasks || []);
      } catch (error) {
        console.error("Error fetching task alerts:", error);
        setTaskAlerts([]);
      } finally {
        setIsTasksFetching(false); // ✅ Use isTasksFetching
      }
    }

    fetchTaskAlerts();
  }, [currentProperty?.id]); // ✅ Only depend on property ID

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
          <div className="p-6">
            <DashboardLayout
              stats={{
                upcomingVisits,
                inventoryAlerts,
                maintenanceAlerts: taskAlerts, // Map to the expected prop name
                totalInventoryCount,
              }}
              onAddReservation={() => setShowAddReservationModal(true)}
              enabledComponents={["stats", "visits", "inventory", "tasks"]} // Changed "maintenance" to "tasks"
            />
          </div>
        </div>
      </ProtectedPageWrapper>
    </ProtectedRoute>
  );
}
