"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import MainLayout from "@/components/layout/MainLayout"; // ✅ Use MainLayout
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

export default function CleaningPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  // Add refs to prevent double fetching
  const loadingRef = useRef(false);
  const lastPropertyIdRef = useRef<string | null>(null);

  useEffect(() => {
    async function loadCleaningStats() {
      if (!currentProperty?.id) {
        setLoading(false);
        return;
      }

      // Prevent double fetching for same property
      if (loadingRef.current || lastPropertyIdRef.current === currentProperty.id) {
        return;
      }

      loadingRef.current = true;
      lastPropertyIdRef.current = currentProperty.id;

      try {
        console.log('🏠 Property and user loaded, fetching sections:', currentProperty.name);
        
        // Mock data for now
        const mockStats = {
          totalTasks: 12,
          completedTasks: 8,
          pendingTasks: 3,
          overdueTasks: 1,
        };

        setStats(mockStats);
      } catch (error) {
        console.error("Error loading cleaning stats:", error);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    }

    loadCleaningStats();
    
    // Cleanup function
    return () => {
      loadingRef.current = false;
    };
  }, [currentProperty?.id]);

  // Reset refs when property changes
  useEffect(() => {
    if (currentProperty?.id !== lastPropertyIdRef.current) {
      lastPropertyIdRef.current = null;
      loadingRef.current = false;
    }
  }, [currentProperty?.id]);

  if (authLoading || propertyLoading) {
    return (
      <MainLayout>
        <div className="p-6">
          <StandardCard>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading cleaning dashboard...</span>
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
            subtitle="Manage cleaning tasks and track progress"
          >
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading stats...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Tasks */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-900">
                        Total Tasks
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.totalTasks}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Completed Tasks */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-900">
                        Completed
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.completedTasks}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pending Tasks */}
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-900">
                        Pending
                      </p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {stats.pendingTasks}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Overdue Tasks */}
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-900">Overdue</p>
                      <p className="text-2xl font-bold text-red-600">
                        {stats.overdueTasks}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </StandardCard>

          {/* Quick Actions Card */}
          <StandardCard
            title="Quick Actions"
            subtitle="Access cleaning tools and features"
          >
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              {/* Cleaning Checklist - Now the main focus */}
              <Link href="/cleaning/checklist" className="group block">
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-8 border-2 border-green-200 hover:border-green-300 transition-colors">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Sparkles className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="ml-4 text-xl font-semibold text-gray-900">
                      Room Cleaning Checklist
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Manage cleaning tasks by room and track your progress. Stay organized with our comprehensive room-by-room cleaning system.
                  </p>
                  <div className="flex items-center text-green-600 group-hover:text-green-700">
                    <span className="font-medium">Start Cleaning Checklist</span>
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </div>
                </div>
              </Link>
            </div>
          </StandardCard>

          {/* Recent Activity Card */}
          <StandardCard
            title="Recent Activity"
            subtitle="Latest cleaning task updates"
          >
            <div className="space-y-3">
              <div className="text-center py-8 text-gray-500">
                <Clock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p>No recent activity</p>
                <p className="text-sm mt-1">
                  Cleaning tasks will appear here once you start using the checklist
                </p>
              </div>
            </div>
          </StandardCard>

          {/* Help Section */}
          <div className="text-gray-500 text-sm bg-gray-50 rounded-lg p-4">
            <p className="mb-2">
              💡 <strong>Getting Started:</strong>
            </p>
            <ul className="space-y-1">
              <li>
                • Use the <strong>Room Checklist</strong> to manage cleaning tasks by room
              </li>
              <li>• Check off completed tasks as you clean each room</li>
              <li>• Track your progress with the dashboard statistics</li>
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
