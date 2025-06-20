"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import StandardCard from "@/components/ui/StandardCard";
import { AlertTriangle, User, Database } from "lucide-react";

export default function AuthDebug() {
  const { user } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [dbCheck, setDbCheck] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      // Get current session
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSession(currentSession);

      // Test database connection
      try {
        const { data, error } = await supabase.rpc("get_current_user_id"); // We'll create this function

        if (error) {
          setDbCheck({ error: error.message });
        } else {
          setDbCheck({ success: true, userId: data });
        }
      } catch (err) {
        // Fallback: try a simple select
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("id")
            .limit(1);

          if (error) {
            setDbCheck({ error: error.message });
          } else {
            setDbCheck({ success: true, canQuery: true });
          }
        } catch (fallbackErr) {
          setDbCheck({ error: "Cannot connect to database" });
        }
      }
    };

    checkAuth();
  }, []);

  return (
    <StandardCard title="🔐 Authentication Debug">
      <div className="space-y-4">
        {/* Auth Hook Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-blue-500" />
            <span className="font-medium">useAuth() User:</span>
          </div>
          <div
            className={`text-sm ${user ? "text-green-600" : "text-red-600"}`}
          >
            {user ? `✓ ${user.email}` : "✗ No user"}
          </div>

          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-purple-500" />
            <span className="font-medium">Session:</span>
          </div>
          <div
            className={`text-sm ${session ? "text-green-600" : "text-red-600"}`}
          >
            {session ? `✓ Active` : "✗ No session"}
          </div>

          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-orange-500" />
            <span className="font-medium">Database:</span>
          </div>
          <div
            className={`text-sm ${
              dbCheck?.success ? "text-green-600" : "text-red-600"
            }`}
          >
            {dbCheck?.success
              ? "✓ Connected"
              : `✗ ${dbCheck?.error || "Not checked"}`}
          </div>
        </div>

        {/* Detailed Info */}
        {user && (
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm space-y-1">
              <div>
                <strong>User ID:</strong>{" "}
                <code className="text-xs">{user.id}</code>
              </div>
              <div>
                <strong>Email:</strong> {user.email}
              </div>
              <div>
                <strong>Created:</strong>{" "}
                {new Date(user.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Session Info */}
        {session && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm space-y-1">
              <div>
                <strong>Access Token:</strong>{" "}
                <code className="text-xs">
                  {session.access_token?.substring(0, 20)}...
                </code>
              </div>
              <div>
                <strong>Expires:</strong>{" "}
                {new Date(session.expires_at * 1000).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Errors */}
        {(!user || !session) && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800">Authentication Issue</p>
                <p className="text-red-700 mt-1">
                  You may need to log out and log back in. Check your browser's
                  developer console for errors.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Fix */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">Quick Fixes:</p>
          <div className="space-y-2 text-xs text-gray-600">
            <p>1. Try refreshing the page</p>
            <p>2. Log out and log back in</p>
            <p>3. Check browser console for errors</p>
            <p>4. Clear browser storage and cookies</p>
          </div>
        </div>
      </div>
    </StandardCard>
  );
}
