"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header";
import StandardCard from "@/components/ui/StandardCard";
import {
  Bell,
  Mail,
  MessageSquare,
  Calendar,
  AlertTriangle,
} from "lucide-react";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    email: {
      reservations: true,
      maintenance: true,
      guestMessages: false,
      marketing: false,
    },
    push: {
      reservations: true,
      maintenance: true,
      guestMessages: true,
      marketing: false,
    },
  });

  const handleSettingChange = (
    type: "email" | "push",
    setting: string,
    value: boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [setting]: value,
      },
    }));
  };

  const notificationTypes = [
    {
      key: "reservations",
      label: "Reservations & Bookings",
      description: "New reservations, cancellations, and booking updates",
      icon: Calendar,
    },
    {
      key: "maintenance",
      label: "Maintenance & Tasks",
      description:
        "Task assignments, completions, and urgent maintenance alerts",
      icon: AlertTriangle,
    },
    {
      key: "guestMessages",
      label: "Guest Messages",
      description: "Messages and inquiries from guests",
      icon: MessageSquare,
    },
    {
      key: "marketing",
      label: "Marketing & Updates",
      description: "Product updates, tips, and promotional content",
      icon: Mail,
    },
  ];

  return (
    <div className="p-6">
      <Header title="Notification Preferences" />
      <PageContainer>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Notifications
              </h1>
              <p className="text-gray-600">
                Manage how you receive notifications
              </p>
            </div>
          </div>

          {/* Notification Settings */}
          <StandardCard
            title="Notification Preferences"
            subtitle="Choose how you want to be notified"
          >
            <div className="space-y-6">
              {/* Header Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-gray-200">
                <div className="font-medium text-gray-900">
                  Notification Type
                </div>
                <div className="font-medium text-gray-900 text-center">
                  Email
                </div>
                <div className="font-medium text-gray-900 text-center">
                  Push
                </div>
              </div>

              {/* Notification Rows */}
              {notificationTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.key}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4 border-b border-gray-100 last:border-b-0"
                  >
                    {/* Notification Type */}
                    <div className="flex items-start space-x-3">
                      <Icon className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {type.label}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {type.description}
                        </div>
                      </div>
                    </div>

                    {/* Email Toggle */}
                    <div className="flex justify-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={
                            settings.email[
                              type.key as keyof typeof settings.email
                            ]
                          }
                          onChange={(e) =>
                            handleSettingChange(
                              "email",
                              type.key,
                              e.target.checked
                            )
                          }
                        />
                        <div
                          className={`w-11 h-6 rounded-full transition-colors ${
                            settings.email[
                              type.key as keyof typeof settings.email
                            ]
                              ? "bg-blue-600"
                              : "bg-gray-200"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${
                              settings.email[
                                type.key as keyof typeof settings.email
                              ]
                                ? "translate-x-6"
                                : "translate-x-1"
                            } mt-1`}
                          />
                        </div>
                      </label>
                    </div>

                    {/* Push Toggle */}
                    <div className="flex justify-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={
                            settings.push[
                              type.key as keyof typeof settings.push
                            ]
                          }
                          onChange={(e) =>
                            handleSettingChange(
                              "push",
                              type.key,
                              e.target.checked
                            )
                          }
                        />
                        <div
                          className={`w-11 h-6 rounded-full transition-colors ${
                            settings.push[
                              type.key as keyof typeof settings.push
                            ]
                              ? "bg-blue-600"
                              : "bg-gray-200"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${
                              settings.push[
                                type.key as keyof typeof settings.push
                              ]
                                ? "translate-x-6"
                                : "translate-x-1"
                            } mt-1`}
                          />
                        </div>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </StandardCard>

          {/* Email Frequency Card */}
          <StandardCard
            title="Email Frequency"
            subtitle="How often you receive email summaries"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["Immediate", "Daily Summary", "Weekly Summary"].map(
                  (frequency) => (
                    <label
                      key={frequency}
                      className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="radio"
                        name="emailFrequency"
                        value={frequency.toLowerCase().replace(" ", "-")}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        defaultChecked={frequency === "Immediate"}
                      />
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">
                          {frequency}
                        </div>
                        <div className="text-sm text-gray-500">
                          {frequency === "Immediate" &&
                            "Get notified right away"}
                          {frequency === "Daily Summary" &&
                            "Once per day digest"}
                          {frequency === "Weekly Summary" && "Weekly roundup"}
                        </div>
                      </div>
                    </label>
                  )
                )}
              </div>
            </div>
          </StandardCard>

          {/* Save Button */}
          <div className="flex justify-end">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Save Preferences
            </button>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
