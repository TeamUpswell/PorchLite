"use client";

import StatsOverview from "./StatsOverview";
import UpcomingVisits from "./UpcomingVisits";
import InventoryAlerts from "./InventoryAlerts";
import TaskAlerts from "./TaskAlerts"; // Import the new component
import DashboardHeader from "./DashboardHeader";

interface DashboardLayoutProps {
  stats: {
    upcomingVisits: any[];
    inventoryAlerts: any[];
    maintenanceAlerts: any[]; // Keep the name for backward compatibility
    totalInventoryCount: number;
  };
  onAddReservation: () => void;
  enabledComponents?: string[];
}

export default function DashboardLayout({
  stats,
  onAddReservation,
  enabledComponents = ['stats', 'visits', 'inventory', 'tasks']
}: DashboardLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Use your existing DashboardHeader */}
      <DashboardHeader>
        <h1 className="text-4xl font-bold mb-2">
          Welcome Back
        </h1>
        <p className="text-xl opacity-90">
          Property Dashboard
        </p>
      </DashboardHeader>

      {/* Stats Overview */}
      {enabledComponents.includes('stats') && (
        <StatsOverview {...stats} />
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {enabledComponents.includes('visits') && (
            <UpcomingVisits
              visits={stats.upcomingVisits}
              onAddReservation={onAddReservation}
            />
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {enabledComponents.includes('inventory') && (
            <InventoryAlerts alerts={stats.inventoryAlerts} />
          )}
          
          {enabledComponents.includes('tasks') && (
            <TaskAlerts alerts={stats.maintenanceAlerts} />
          )}
        </div>
      </div>
    </div>
  );
}