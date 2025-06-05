"use client";

import { useAuth } from "@/components/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SideNavigation from "@/components/SideNavigation";
import Header from "./Header";

interface ProtectedPageWrapperProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "manager" | "family" | "guest";
}

export default function ProtectedPageWrapper({
  children,
  requiredRole,
}: ProtectedPageWrapperProps) {
  const { user, loading, hasPermission } = useAuth();
  const router = useRouter();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && !hasPermission(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="grid min-h-screen transition-all duration-300 ease-in-out"
      style={{
        gridTemplateColumns: sidebarCollapsed ? "64px 1fr" : "256px 1fr",
        gridTemplateRows: "auto 1fr",
        gridTemplateAreas: `
          "sidebar header"
          "sidebar content"
        `,
      }}
    >
      <div 
        style={{ gridArea: "sidebar" }} 
        className="bg-gray-900 dark:bg-gray-900 relative overflow-hidden row-span-2"
      >
        <div className="h-full w-full">
          <SideNavigation
            user={user}
            onCollapseChange={setSidebarCollapsed}
            useGridLayout={true}
          />
        </div>
      </div>
      
      <div style={{ gridArea: "header" }}>
        <Header />
      </div>
      
      <div style={{ gridArea: "content" }} className="overflow-auto">
        {children}
      </div>
    </div>
  );
}
