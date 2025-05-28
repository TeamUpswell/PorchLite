"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function AdminUserCreation() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const createUser = async () => {
    setLoading(true);
    try {
      // Create admin client with service role key
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        // You'll need to add this env var to your project
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || ""
      );

      // Step 1: Create auth user
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Skip email confirmation
      });

      if (error) throw error;

      // Step 2: Create profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: data.user.id,
          email,
          full_name: "",
        });

      if (profileError) throw profileError;

      // Step 3: Create role
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: data.user.id,
          role: "owner",
        });

      if (roleError) throw roleError;

      setResult({ success: true, user: data.user });
    } catch (error: any) {
      console.error("Error:", error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Create Admin User</h1>

      <div className="space-y-4">
        <div>
          <label htmlFor="email-input" className="block mb-1">Email</label>
          <input
            id="email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter admin email address"
            aria-label="Email address"
            required
          />
        </div>

        <div>
          <label htmlFor="password-input" className="block mb-1">Password</label>
          <input
            id="password-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter secure password"
            aria-label="Password"
            required
            minLength={8}
          />
        </div>

        <button
          onClick={createUser}
          disabled={loading}
          className="p-2 bg-red-500 text-white rounded"
        >
          {loading ? "Creating..." : "Create Admin User"}
        </button>
      </div>

      {result && (
        <div className="mt-4">
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
