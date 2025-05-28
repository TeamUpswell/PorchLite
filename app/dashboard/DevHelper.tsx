"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

export default function DevHelper() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const assignRole = async (role: string) => {
    if (!user?.id) {
      toast.error("You need to be logged in");
      return;
    }

    setLoading(role);

    try {
      // First check if role already exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id)
        .eq("role", role)
        .single();

      if (existingRole) {
        toast.success(`You already have the ${role} role!`);
        setLoading(null);
        return;
      }

      // Modified insert that doesn't use assigned_at
      const { error } = await supabase.from("user_roles").insert([
        {
          user_id: user.id,
          role: role,
          // Removed assigned_at field
        },
      ]);

      if (error) throw error;

      toast.success(`${role} role granted! Refreshing...`);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("Failed to assign role:", err);
      toast.error(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(null);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-gray-100 p-3 rounded-lg mb-6">
      <h3 className="text-sm font-bold mb-2">Development Helper</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => assignRole("owner")}
          disabled={loading === "owner"}
          className="bg-purple-500 hover:bg-purple-600 text-white text-xs py-1 px-2 rounded"
        >
          {loading === "owner" ? "..." : "Grant Owner Role"}
        </button>
        <button
          onClick={() => assignRole("manager")}
          disabled={loading === "manager"}
          className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded"
        >
          {loading === "manager" ? "..." : "Grant Manager Role"}
        </button>
        <button
          onClick={() => assignRole("family")}
          disabled={loading === "family"}
          className="bg-green-500 hover:bg-green-600 text-white text-xs py-1 px-2 rounded"
        >
          {loading === "family" ? "..." : "Grant Family Role"}
        </button>
      </div>
    </div>
  );
}
