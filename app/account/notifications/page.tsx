"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function NotificationsPage() {
  const { user } = useAuth();

  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Notification Preferences</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Notification preferences will be available here.
        </p>
      </div>
    </>
  );
}
