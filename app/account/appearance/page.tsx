"use client";

export const revalidate = 0; // Using 0 instead of false
export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { useAuth } from "@/components/auth";
import { useTheme } from "@/components/ThemeProvider";

// Define the Theme type or import it
type Theme = "light" | "dark" | "system";

export default function AppearancePage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [saveMessage, setSaveMessage] = useState("");

  // Fix: Type the parameter as Theme instead of string
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setSaveMessage("Theme updated successfully!");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Appearance Settings</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Theme</label>
          <select
            value={theme}
            onChange={(e) => handleThemeChange(e.target.value as Theme)}
            className="w-full p-2 border rounded"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>

        {saveMessage && (
          <div className="text-green-600 text-sm">{saveMessage}</div>
        )}
      </div>
    </div>
  );
}
