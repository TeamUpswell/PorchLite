"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import MainLayout from "@/components/layout/MainLayout";
import StandardCard from "@/components/ui/StandardCard";
import Link from "next/link";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Calendar,
  Users,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface CleaningStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
}

export default function CleaningPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const [stats, setStats] = useState<CleaningStats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
  });
  const [loading, setLoading] = useState(false);

  // Refs to prevent multiple fetches and track component mount
  const fetchingRef = useRef(false);
  const hasFetchedRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  // Memoize loading states
  const isLoading = useMemo(() => {
    return authLoading || propertyLoading;
  }, [authLoading, propertyLoading]);

  // Component cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Optimized stats loading function
  const loadCleaningStats = useCallback(async (propertyId: string) => {
    // Prevent duplicate fetches
    if (fetchingRef.current || hasFetchedRef.current === propertyId) {
      return;
    }

    fetchingRef.current = true;
    hasFetchedRef.current = propertyId;

    try {
      console.log("🧽 Loading cleaning stats for property:", propertyId);
      setLoading(true);

      // TODO: Replace with real API call when ready
      // For now, simulate API delay and return mock data
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock data - replace with real Supabase query
      const mockStats: CleaningStats = {
        totalTasks: 12,
        completedTasks: 8,
        pendingTasks: 3,
        overdueTasks: 1,
      };

      // Future real implementation:
      /*
      const { data: cleaningTasks, error } = await supabase
        .from("cleaning_tasks")
        .select("status, due_date")
        .eq("property_id", propertyId);

      if (error) throw error;

      const now = new Date();
      const stats = {
        totalTasks: cleaningTasks?.length || 0,
        completedTasks: cleaningTasks?.filter(task => task.status === "completed").length || 0,
        pendingTasks: cleaningTasks?.filter(task => task.status === "pending").length || 0,
        overdueTasks: cleaningTasks?.filter(task => 
          task.status !== "completed" && 
          task.due_date && 
          new Date(task.due_date) < now
        ).length || 0,
      };
      */

      if (mountedRef.current) {
        console.log("✅ Cleaning stats loaded:", mockStats);
        setStats(mockStats);
      }
    } catch (error) {
      console.error("❌ Error loading cleaning stats:", error);
      if (mountedRef.current) {
        // Reset to default stats on error
        setStats({
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          overdueTasks: 0,
        });
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, []);

  // Single useEffect with proper dependencies
  useEffect(() => {
    if (isLoading || !currentProperty?.id) {
      if (!isLoading) {
        setLoading(false);
      }
      return;
    }

    console.log("🏠 Property loaded, fetching cleaning stats");
    loadCleaningStats(currentProperty.id);
  }, [currentProperty?.id, isLoading, loadCleaningStats]);

  // Reset fetch tracking when property changes
  useEffect(() => {
    if (currentProperty?.id !== hasFetchedRef.current) {
      hasFetchedRef.current = null;
      fetchingRef.current = false;
      setLoading(true);
    }
  }, [currentProperty?.id]);

  // Memoized progress calculation
  const progressPercentage = useMemo(() => {
    if (stats.totalTasks === 0) return 0;
    return Math.round((stats.completedTasks / stats.totalTasks) * 100);
  }, [stats.totalTasks, stats.completedTasks]);

  // Memoized stat cards data
  const statCards = useMemo(() => [
    {
      title: "Total Tasks",
      value: stats.totalTasks,
      icon: CheckCircle,
      color: "blue",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      textColor: "text-blue-900",
      valueColor: "text-blue-600",
    },
    {
      title: "Completed",
      value: stats.completedTasks,
      icon: CheckCircle,
      color: "green",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      textColor: "text-green-900",
      valueColor: "text-green-600",
    },
    {
      title: "Pending",
      value: stats.pendingTasks,
      icon: Clock,
      color: "yellow",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      textColor: "text-yellow-900",
      valueColor: "text-yellow-600",
    },
    {
      title: "Overdue",
      value: stats.overdueTasks,
      icon: AlertCircle,
      color: "red",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      textColor: "text-red-900",
      valueColor: "text-red-600",
    },
  ], [stats]);

  // Loading states
  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-6">
          <StandardCard>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">⏳ Loading cleaning dashboard...</p>
              </div>
            </div>
          </StandardCard>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return null;
  }

  if (!currentProperty) {
    return (
      <MainLayout>
        <div className="p-6">
          <StandardCard>
            <div className="text-center py-8">
              <Sparkles className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No Property Selected
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Please select a property to view cleaning tasks.
              </p>
            </div>
          </StandardCard>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Overview Stats Card */}
          <StandardCard
            title={`${currentProperty.name} - Cleaning Dashboard`}
            subtitle={`Manage cleaning tasks and track progress • ${progressPercentage}% complete`}
          >
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading stats...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Progress Bar */}
                {stats.totalTasks > 0 && (
                  <div className="rounded-lg bg-gray-100 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Cleaning Progress
                      </span>
                      <span className="text-sm font-medium text-gray-500">
                        {progressPercentage}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-green-600 rounded-full"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Stat Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {statCards.map((card, index) => (
                    <div
                      key={index}
                      className={`rounded-lg shadow-md p-4 flex items-center space-x-4 ${card.bgColor} ${card.borderColor}`}
                    >
                      <div
                        className={`p-3 rounded-full ${card.iconBg} ${card.iconColor}`}
                      >
                        <card.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${card.textColor}`}>
                          {card.title}
                        </p>
                        <p className={`text-lg font-bold ${card.valueColor}`}>
                          {card.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:space-x-4">
                  <Link
                    href="/cleaning/tasks"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    New Cleaning Task
                  </Link>
                  <Link
                    href="/cleaning/history"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg shadow-md hover:bg-gray-200 transition-all duration-200"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    View Cleaning History
                  </Link>
                </div>
              </div>
            )}
          </StandardCard>

          {/* Detailed Stats Table - Hidden on small screens */}
          <div className="hidden sm:block">
            <StandardCard title="Detailed Cleaning Stats">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Task
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Due Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* TODO: Replace with real data rows */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          Sample Task 1
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs inline-flex items-center font-semibold rounded-full px-2.5 py-0.5 bg-green-100 text-green-800">
                          Completed
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">2023-10-10</div>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          Sample Task 2
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs inline-flex items-center font-semibold rounded-full px-2.5 py-0.5 bg-red-100 text-red-800">
                          Overdue
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">2023-09-30</div>
                      </td>
                    </tr>
                    {/* More rows... */}
                  </tbody>
                </table>
              </div>
            </StandardCard>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
