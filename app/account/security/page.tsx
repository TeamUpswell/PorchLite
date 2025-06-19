"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/components/auth";
import { supabase } from "@/lib/supabase";
import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header";
import StandardCard from "@/components/ui/StandardCard";
import { Key, Shield, LogOut } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function SecurityPage() {
  const { user } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState({
    text: "",
    type: "",
  });
  const [showConfirm, setShowConfirm] = useState(false);

  // Password change function
  const changePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (!newPassword) {
      setPasswordMessage({ text: "New password is required", type: "error" });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({
        text: "Password must be at least 8 characters",
        type: "error",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: "Passwords don't match", type: "error" });
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage({ text: "", type: "" });

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage({
        text: "Password updated successfully",
        type: "success",
      });
    } catch (error: unknown) {
      console.error("Error changing password:", error);
      let errorMessage = "Error changing password";

      // Type guard for error object with message property
      if (error && typeof error === "object" && "message" in error) {
        errorMessage = error.message as string;
      }

      setPasswordMessage({
        text: errorMessage,
        type: "error",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSignOutAll = async () => {
    try {
      await supabase.auth.signOut({ scope: "global" });
      window.location.href = "/auth";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="p-6">
      <Header title="Security Settings" />
      <PageContainer>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Security Settings
              </h1>
              <p className="text-gray-600">
                Manage your account security and password
              </p>
            </div>
          </div>

          {/* Password Change Section */}
          <StandardCard
            title="Password"
            subtitle="Change your account password"
            icon={<Key className="h-5 w-5 text-gray-600" />}
          >
            {passwordMessage.text && (
              <div
                className={`mb-4 p-4 rounded-md ${
                  passwordMessage.type === "error"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-green-50 text-green-700 border border-green-200"
                }`}
              >
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={changePassword} className="space-y-4">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your current password"
                />
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your new password"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Password must be at least 8 characters
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm your new password"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChangingPassword ? "Updating..." : "Change Password"}
                </button>
              </div>
            </form>
          </StandardCard>

          {/* Additional Security Sections */}
          <StandardCard
            title="Account Security"
            subtitle="Additional security features"
            icon={<Shield className="h-5 w-5 text-gray-600" />}
          >
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1">
                  Two-Factor Authentication
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  Add an extra layer of security to your account
                </p>
                <button className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
                  Enable 2FA (Coming Soon)
                </button>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-1">
                  Login Activity
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Monitor recent login activity and suspicious attempts
                </p>
                <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-100 transition-colors">
                  View Activity (Coming Soon)
                </button>
              </div>
            </div>
          </StandardCard>

          {/* Session Management */}
          <StandardCard
            title="Account Sessions"
            subtitle="Manage your active sessions"
            icon={<LogOut className="h-5 w-5 text-gray-600" />}
          >
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Sign out from all devices if you suspect unauthorized access to
                your account.
              </p>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <LogOut className="h-5 w-5 text-yellow-600 mt-0.5" />
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="font-medium text-yellow-900">
                      Sign Out All Devices
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      This will sign you out from all devices and require you to
                      log in again.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                onClick={() => setShowConfirm(true)}
              >
                Sign Out From All Devices
              </button>
            </div>
          </StandardCard>

          {/* Confirm Modal */}
          <ConfirmModal
            open={showConfirm}
            onClose={() => setShowConfirm(false)}
            onConfirm={handleSignOutAll}
            title="Sign Out From All Devices"
            description="Are you sure you want to sign out from all devices? This will require you to log in again."
          />
        </div>
      </PageContainer>
    </div>
  );
}
