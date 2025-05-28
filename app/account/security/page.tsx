"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Key, Shield, LogOut } from "lucide-react";

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

  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Security Settings</h1>

      {/* Password Change Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <div className="flex items-center mb-4">
          <Key className="mr-2 h-5 w-5 text-gray-400" />
          <h2 className="text-xl font-semibold">Password</h2>
        </div>

        {passwordMessage.text && (
          <div
            className={`mb-4 p-4 rounded-md ${
              passwordMessage.type === "error"
                ? "bg-red-100 text-red-700 border border-red-200"
                : "bg-green-100 text-green-700 border border-green-200"
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isChangingPassword ? "Updating..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>

      {/* Additional Security Sections */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <div className="flex items-center mb-4">
          <Shield className="mr-2 h-5 w-5 text-gray-400" />
          <h2 className="text-xl font-semibold">Account Security</h2>
        </div>

        {/* You can add two-factor authentication or other security features here */}
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Additional security features like two-factor authentication coming
          soon.
        </p>
      </div>

      {/* Session Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <LogOut className="mr-2 h-5 w-5 text-gray-400" />
          <h2 className="text-xl font-semibold">Account Sessions</h2>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Sign out from all devices if you suspect unauthorized access to your
          account.
        </p>

        <button
          type="button"
          className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          onClick={async () => {
            try {
              await supabase.auth.signOut({ scope: "global" });
              window.location.href = "/login";
            } catch (error) {
              console.error("Error signing out:", error);
            }
          }}
        >
          Sign Out From All Devices
        </button>
      </div>
    </>
  );
}
