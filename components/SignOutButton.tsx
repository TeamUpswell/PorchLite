"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

interface SignOutButtonProps {
  variant?: "button" | "card";
  className?: string;
}

export default function SignOutButton({ variant = "button", className = "" }: SignOutButtonProps) {
  const { logout } = useAuth();

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      try {
        await logout();
      } catch (error) {
        console.error('Error signing out:', error);
        alert('Failed to sign out. Please try again.');
      }
    }
  };

  if (variant === "card") {
    return (
      <button 
        onClick={handleSignOut}
        className={`flex items-center justify-between w-full p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors group ${className}`}
      >
        <div className="flex items-center">
          <LogOut className="h-5 w-5 text-red-500 mr-3" />
          <div className="text-left">
            <h4 className="font-medium text-red-900 group-hover:text-red-700">Sign Out</h4>
            <p className="text-sm text-red-600">Sign out from your account</p>
          </div>
        </div>
        <LogOut className="h-4 w-4 text-red-400" />
      </button>
    );
  }

  return (
    <button
      onClick={handleSignOut}
      className={`flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ${className}`}
    >
      <LogOut className="h-4 w-4 mr-2" />
      Sign Out
    </button>
  );
}