"use client";

import { useState } from "react";
import SideNavigation from "@/components/SideNavigation";
import Header from "./Header";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <SideNavigation
        onCollapseChange={(collapsed) => setSidebarCollapsed(collapsed)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header - assume it's h-14 (3.5rem) */}
        <Header />

        {/* Main content - account for header height */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
