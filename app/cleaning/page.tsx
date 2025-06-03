"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { ClipboardCheck, Plus, Wrench, Package } from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import RoomCard from "./components/RoomCard";

interface Room {
  id: string;
  name: string;
  description?: string;
  property_id: string;
  created_at: string;
}

export default function CleaningPage() {
  const { user } = useAuth();
  const { currentProperty } = useProperty();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!currentProperty?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get rooms data
        const { data: roomsData, error: roomsError } = await supabase
          .from("rooms")
          .select("*")
          .eq("property_id", currentProperty.id);

        if (roomsError) throw roomsError;

        setRooms(roomsData || []);
      } catch (error) {
        console.error("Error loading rooms data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentProperty]);

  const quickActions = [
    {
      name: "Room Checklist",
      href: "/cleaning/checklist",
      icon: ClipboardCheck,
      description: "View cleaning checklists",
    },
    {
      name: "Manage Tasks",
      href: "/cleaning/tasks",
      icon: Wrench,
      description: "Manage cleaning tasks",
    },
    {
      name: "Inventory",
      href: "/cleaning/inventory",
      icon: Package,
      description: "Check cleaning supplies",
    },
  ];

  return (
    <StandardPageLayout
      title="Cleaning Management"
      subtitle={`${currentProperty?.name || "Property"} cleaning overview`}
      headerIcon={<ClipboardCheck className="h-6 w-6 text-blue-600" />}
      headerActions={
        <Link
          href="/cleaning/tasks/create"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Link>
      }
    >
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <StandardCard key={action.href} hover>
              <Link href={action.href} className="block">
                <div className="text-center">
                  <div className="p-3 bg-blue-50 rounded-lg w-fit mx-auto mb-3">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {action.name}
                  </h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </Link>
            </StandardCard>
          );
        })}
      </div>

      {/* Rooms Section */}
      <StandardCard
        title="Rooms"
        subtitle="Select a room to view cleaning details"
        className="mb-8"
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : rooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <RoomCard room={room} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p>No rooms found</p>
            <p className="text-sm mt-1">
              Add rooms to start managing cleaning tasks
            </p>
          </div>
        )}
      </StandardCard>
    </StandardPageLayout>
  );
}
