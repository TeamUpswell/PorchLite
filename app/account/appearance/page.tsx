"use client";

// REMOVE ANY EXISTING revalidate CONFIGS
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header";
import StandardCard from "@/components/ui/StandardCard";
import { Monitor, Moon, Sun, Palette } from "lucide-react";

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

  const getThemeIcon = (themeOption: Theme) => {
    switch (themeOption) {
      case "light":
        return Sun;
      case "dark":
        return Moon;
      case "system":
        return Monitor;
      default:
        return Sun;
    }
  };

  const getThemeDescription = (themeOption: Theme) => {
    switch (themeOption) {
      case "light":
        return "Always use light theme";
      case "dark":
        return "Always use dark theme";
      case "system":
        return "Follow system preference";
      default:
        return "";
    }
  };

  return (
    <div className="p-6">
      <Header title="Appearance Settings" />
      <PageContainer>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center space-x-3">
            <Palette className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Appearance</h1>
              <p className="text-gray-600">
                Customize your app&apos;s appearance and theme
              </p>
            </div>
          </div>

          {/* Theme Selection Card */}
          <StandardCard
            title="Theme"
            subtitle="Choose your preferred color scheme"
          >
            <div className="space-y-4">
              {/* Theme Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["light", "dark", "system"] as Theme[]).map((themeOption) => {
                  const Icon = getThemeIcon(themeOption);
                  const isSelected = theme === themeOption;

                  return (
                    <button
                      key={themeOption}
                      onClick={() => handleThemeChange(themeOption)}
                      className={`relative p-4 border-2 rounded-lg transition-all hover:shadow-md ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-center">
                        <Icon
                          className={`h-8 w-8 mx-auto mb-2 ${
                            isSelected ? "text-blue-600" : "text-gray-600"
                          }`}
                        />
                        <h3
                          className={`font-medium capitalize ${
                            isSelected
                              ? "text-blue-900 dark:text-blue-100"
                              : "text-gray-900"
                          }`}
                        >
                          {themeOption}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {getThemeDescription(themeOption)}
                        </p>
                      </div>

                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legacy Select (if needed for accessibility) */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme (Dropdown)
                </label>
                <select
                  value={theme}
                  onChange={(e) => handleThemeChange(e.target.value as Theme)}
                  className="w-full md:w-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                >
                  <option value="light">Light Theme</option>
                  <option value="dark">Dark Theme</option>
                  <option value="system">System Default</option>
                </select>
              </div>

              {/* Success Message */}
              {saveMessage && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-green-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        {saveMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </StandardCard>

          {/* Preview Card */}
          <StandardCard title="Preview" subtitle="See how your theme looks">
            <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Sample Content
                  </h3>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                    {theme === "system"
                      ? "System"
                      : theme === "light"
                      ? "Light"
                      : "Dark"}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  This is how text content will appear with your selected theme.
                </p>
                <div className="flex space-x-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Primary Button
                  </button>
                  <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Secondary Button
                  </button>
                </div>
              </div>
            </div>
          </StandardCard>
        </div>
      </PageContainer>
    </div>
  );
}
