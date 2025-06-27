"use client";

// REMOVE ANY EXISTING revalidate CONFIGS
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { Monitor, Moon, Sun, Palette, CheckCircle } from "lucide-react";

// Define the Theme type or import it
type Theme = "light" | "dark" | "system";

export default function AppearancePage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [saveMessage, setSaveMessage] = useState("");

  // Handle theme change with feedback
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
    <StandardPageLayout
      title="Appearance"
      subtitle="Customize your app's appearance and theme"
      breadcrumb={[
        { label: "Account", href: "/account" },
        { label: "Appearance" }
      ]}
    >
      <div className="space-y-6">
        {/* Success Message - Show at top level when present */}
        {saveMessage && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
              <p className="ml-3 text-sm font-medium text-green-800 dark:text-green-200">
                {saveMessage}
              </p>
            </div>
          </div>
        )}

        {/* Theme Selection Card */}
        <StandardCard
          title="Theme Settings"
          subtitle="Choose your preferred color scheme"
          headerActions={
            theme && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Palette className="h-4 w-4 mr-1" />
                Current: {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </div>
            )
          }
        >
          <div className="space-y-6">
            {/* Theme Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["light", "dark", "system"] as Theme[]).map((themeOption) => {
                const Icon = getThemeIcon(themeOption);
                const isSelected = theme === themeOption;

                return (
                  <button
                    key={themeOption}
                    onClick={() => handleThemeChange(themeOption)}
                    className={`relative p-4 border-2 rounded-lg transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                    aria-pressed={isSelected}
                    aria-label={`Select ${themeOption} theme`}
                  >
                    <div className="text-center">
                      <Icon
                        className={`h-8 w-8 mx-auto mb-2 ${
                          isSelected 
                            ? "text-blue-600 dark:text-blue-400" 
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      />
                      <h3
                        className={`font-medium capitalize ${
                          isSelected
                            ? "text-blue-900 dark:text-blue-100"
                            : "text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {themeOption}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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

            {/* Alternative Dropdown Selection */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <label 
                htmlFor="theme-select"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Alternative Selection (Dropdown)
              </label>
              <select
                id="theme-select"
                value={theme}
                onChange={(e) => handleThemeChange(e.target.value as Theme)}
                className="w-full md:w-64 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="light">Light Theme</option>
                <option value="dark">Dark Theme</option>
                <option value="system">System Default</option>
              </select>
            </div>
          </div>
        </StandardCard>

        {/* Theme Preview Card */}
        <StandardCard
          title="Theme Preview"
          subtitle="See how your selected theme looks"
        >
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
                    : "Dark"} Theme
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                This is how text content will appear with your selected theme. The
                interface automatically adapts to provide optimal readability and
                visual comfort.
              </p>
              <div className="flex flex-wrap gap-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Primary Button
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Secondary Button
                </button>
                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Tertiary Button
                </button>
              </div>
            </div>
          </div>
        </StandardCard>

        {/* Theme Information Card */}
        <StandardCard
          title="About Themes"
          subtitle="Learn more about theme options"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <Sun className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                Light Theme
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Best for daytime use and well-lit environments
              </p>
            </div>
            <div className="text-center p-4">
              <Moon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                Dark Theme
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reduces eye strain in low-light conditions
              </p>
            </div>
            <div className="text-center p-4">
              <Monitor className="h-8 w-8 text-gray-500 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                System Theme
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically matches your device settings
              </p>
            </div>
          </div>
        </StandardCard>

        {/* Theme Persistence Info */}
        <StandardCard
          title="Theme Persistence"
          subtitle="How your theme preference is saved"
        >
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Automatic Saving
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <p>
                    Your theme preference is automatically saved and will be remembered
                    across sessions. No manual saving required!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </StandardCard>
      </div>
    </StandardPageLayout>
  );
}
