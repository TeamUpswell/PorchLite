"use client";

import StatsOverview from "./StatsOverview";
import UpcomingVisits from "./UpcomingVisits";
import InventoryAlerts from "./InventoryAlerts";
import TaskAlerts from "./TaskAlerts";

interface DashboardLayoutProps {
  stats: {
    upcomingVisits: any[];
    inventoryAlerts: any[];
    maintenanceAlerts: any[];
    totalInventoryCount: number;
  };
  loading?: {
    visits: boolean;
    inventory: boolean;
    tasks: boolean;
  };
  onAddReservation: () => void;
  enabledComponents?: string[];
  showBanner?: boolean;
}

export default function DashboardLayout({
  stats,
  loading = { visits: false, inventory: false, tasks: false },
  onAddReservation,
  enabledComponents = ['stats', 'visits', 'inventory', 'tasks'],
  showBanner = false
}: DashboardLayoutProps) {
  return (
    <div className="space-y-6">
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
              loading={loading.visits}
            />
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {enabledComponents.includes('inventory') && (
            <InventoryAlerts 
              alerts={stats.inventoryAlerts} 
              loading={loading.inventory}
            />
          )}
          
          {enabledComponents.includes('tasks') && (
            <TaskAlerts 
              alerts={stats.maintenanceAlerts}
              loading={loading.tasks}
            />
          )}
        </div>
      </div>
    </div>
  );
}