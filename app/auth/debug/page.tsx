"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthDebug() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testSignup = async () => {
    setLoading(true);
    setResult({ status: "Processing..." });
    
    try {
      // Test direct auth API call
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      setResult({
        success: !error,
        data: data ? {
          user: data.user ? {
            id: data.user.id,
            email: data.user.email,
            emailConfirmed: data.user.email_confirmed_at,
            identitiesLength: data.user.identities?.length
          } : null
        } : null,
        error: error ? { message: error.message, code: error.code } : null
      });
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const checkUser = async () => {
    setLoading(true);
    setResult({ status: "Checking..." });
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();
        
      setResult({
        profile: data,
        error: error ? { message: error.message, code: error.code } : null
      });
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth Debugging</h1>
      
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="input-id-1" className="block text-sm font-medium text-gray-700 mb-1">
            Input Label Text
          </label>
          <input 
            id="input-id-1"
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            aria-label="Description of what this input is for"
            placeholder="Helpful placeholder text"
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label htmlFor="input-id-2" className="block text-sm font-medium text-gray-700 mb-1">
            Second Input Label
          </label>
          <input 
            id="input-id-2"
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            aria-label="Description of what this second input is for"
            placeholder="Another helpful placeholder"
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={testSignup} 
            disabled={loading || !email || !password || password.length < 6}
            className="flex-1 p-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Test Signup
          </button>
          
          <button
            onClick={checkUser}
            disabled={loading || !email}
            className="flex-1 p-2 bg-green-500 text-white rounded disabled:bg-gray-300"
          >
            Check User
          </button>
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold mb-2">Result:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}