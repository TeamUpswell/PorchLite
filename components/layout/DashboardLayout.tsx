"use client";

import React from "react";
import ProtectedPageWrapper from "./ProtectedPageWrapper";

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function DashboardLayout({
  children,
  className = "",
}: DashboardLayoutProps) {
  return (
    <ProtectedPageWrapper>
      {/* Full-width dashboard without header constraints */}
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        {children}
      </div>
    </ProtectedPageWrapper>
  );
}