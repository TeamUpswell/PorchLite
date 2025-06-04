"use client";

import StandardCard from "@/components/ui/StandardCard";
import { Calendar, Package, AlertTriangle, CheckSquare } from "lucide-react";
import Link from "next/link";

interface StatsOverviewProps {
  upcomingVisits: any[];
  inventoryAlerts: any[];
  maintenanceAlerts: any[]; // Keep the prop name for now, but treat as tasks
  totalInventoryCount: number;
}

export default function StatsOverview({
  upcomingVisits,
  inventoryAlerts,
  maintenanceAlerts, // This will be tasks data
  totalInventoryCount
}: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Upcoming Visits - Clickable */}
      <Link href="/calendar" className="transition-transform hover:scale-105">
        <StandardCard className="bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Upcoming Visits</p>
              <p className="text-2xl font-bold text-blue-900">{upcomingVisits.length}</p>
            </div>
          </div>
        </StandardCard>
      </Link>

      {/* Inventory Count - Clickable */}
      <Link href="/inventory" className="transition-transform hover:scale-105">
        <StandardCard className="bg-green-50 border-green-200 cursor-pointer hover:bg-green-100">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Total Inventory</p>
              <p className="text-2xl font-bold text-green-900">{totalInventoryCount}</p>
            </div>
          </div>
        </StandardCard>
      </Link>

      {/* Inventory Alerts - Clickable */}
      <Link href="/inventory?filter=alerts" className="transition-transform hover:scale-105">
        <StandardCard className="bg-yellow-50 border-yellow-200 cursor-pointer hover:bg-yellow-100">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Inventory Alerts</p>
              <p className="text-2xl font-bold text-yellow-900">{inventoryAlerts.length}</p>
            </div>
          </div>
        </StandardCard>
      </Link>

      {/* Tasks - Clickable (was Maintenance) */}
      <Link href="/tasks" className="transition-transform hover:scale-105">
        <StandardCard className="bg-purple-50 border-purple-200 cursor-pointer hover:bg-purple-100">
          <div className="flex items-center">
            <CheckSquare className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Pending Tasks</p>
              <p className="text-2xl font-bold text-purple-900">{maintenanceAlerts.length}</p>
            </div>
          </div>
        </StandardCard>
      </Link>
    </div>
  );
}