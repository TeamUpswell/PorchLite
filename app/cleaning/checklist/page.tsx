"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import AuthenticatedLayout from "@/components/auth/AuthenticatedLayout";
import { supabase } from "@/lib/supabase";
import { useProperty } from "@/lib/hooks/useProperty";
import {
  CheckCircle,
  ArrowLeft,
  Home,
  Utensils,
  Bath,
  LucideIcon,
} from "lucide-react";
import RoomCard from "../components/RoomCard";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";

// Define interfaces for our data structures
interface RoomStat {
  total: number;
  completed: number;
}

interface RoomType {
  id: string;
  name: string;
  icon: LucideIcon;
}

interface Property {
  id: string;
  name?: string;
  address?: string;
  [key: string]: any;
}

export default function CleaningChecklist() {
  const { user, loading } = useAuth();
  const { currentProperty } = useProperty();
  const [roomStats, setRoomStats] = useState<Record<string, RoomStat>>({});
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([
    { id: "kitchen", name: "Kitchen", icon: Utensils },
    { id: "living_room", name: "Living Room", icon: Home },
    { id: "master_bedroom", name: "Master Bedroom", icon: Home },
    { id: "guest_bedroom", name: "Guest Bedroom", icon: Home },
    { id: "master_bathroom", name: "Master Bathroom", icon: Bath },
    { id: "guest_bathroom", name: "Guest Bathroom", icon: Bath },
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        if (currentProperty?.id) {
          // Get task statistics for each room
          const { data: tasks, error } = await supabase
            .from("cleaning_tasks")
            .select("room, is_completed")
            .eq("property_id", currentProperty.id);

          if (error) throw error;

          // Calculate stats for each room
          const stats: Record<string, RoomStat> = {};
          roomTypes.forEach((room) => {
            const roomTasks =
              tasks?.filter((task) => task.room === room.id) || [];
            stats[room.id] = {
              total: roomTasks.length,
              completed: roomTasks.filter((task) => task.is_completed).length,
            };
          });

          setRoomStats(stats);
        }
      } catch (error) {
        console.error("Error loading cleaning checklist data:", error);
      }
    }

    loadData();
  }, [roomTypes, currentProperty]);

  useEffect(() => {
    async function loadCustomRooms() {
      if (!currentProperty?.id) return;

      try {
        const { data, error } = await supabase
          .from("cleaning_room_types")
          .select("slug, name, icon")
          .eq("property_id", currentProperty.id);

        if (error) throw error;

        if (data && data.length > 0) {
          // Add custom rooms to the room types
          const iconMap: Record<string, LucideIcon> = {
            home: Home,
            utensils: Utensils,
            bath: Bath,
          };

          const customRooms: RoomType[] = data.map((room) => ({
            id: room.slug,
            name: room.name,
            icon: iconMap[room.icon] || Home,
          }));

          setRoomTypes((prev) => [...prev, ...customRooms]);
        }
      } catch (error) {
        console.error("Error loading custom rooms:", error);
      }
    }

    loadCustomRooms();
  }, [currentProperty]);

  if (loading) {
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
    <AuthenticatedLayout>
      <div className="p-6">
        <Header />
        <PageContainer>
          <StandardCard
            title={`${
              currentProperty?.name || "Property"
            } - Cleaning Checklist`}
            subtitle="Manage your cleaning checklist and tasks"
          >
            <div className="space-y-6">
              {/* Back navigation */}
              <div className="mb-6">
                <Link
                  href="/cleaning/hub"
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Cleaning Hub
                </Link>
              </div>

              {/* Room cards */}
              <div className="space-y-4">
                {roomTypes.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    stats={roomStats[room.id] || { total: 0, completed: 0 }}
                  />
                ))}
              </div>

              {/* Help text */}
              <div className="text-gray-500 text-sm bg-gray-50 rounded-lg p-4 mt-6">
                <p className="mb-2">
                  💡 <strong>Tips:</strong>
                </p>
                <ul className="space-y-1">
                  <li>
                    • Click on any room to view and manage specific cleaning
                    tasks
                  </li>
                  <li>• Mark tasks as complete to track your progress</li>
                  <li>• Green checkmarks indicate completed rooms</li>
                </ul>
              </div>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    </AuthenticatedLayout>
  );
}
