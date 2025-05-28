"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugAuth() {
  const [result, setResult] = useState('');

  const testConnection = async () => {
    try {
      console.log('Testing Supabase connection...');
      const { data, error } = await supabase.auth.getSession();
      console.log('Session data:', data);
      console.log('Session error:', error);
      setResult(JSON.stringify({ data, error }, null, 2));
    } catch (err) {
      console.error('Connection test failed:', err);
      setResult(`Connection failed: ${err.message}`);
    }
  };

  const testLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com', // Replace with a real test email
        password: 'testpassword'   // Replace with real test password
      });
      console.log('Login test:', { data, error });
      setResult(JSON.stringify({ data, error }, null, 2));
    } catch (err) {
      console.error('Login test failed:', err);
      setResult(`Login failed: ${err.message}`);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Auth Debug</h1>
      
      <div className="space-y-4">
        <button 
          onClick={testConnection}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Test Supabase Connection
        </button>
        
        <button 
          onClick={testLogin}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Test Login
        </button>
      </div>
      
      <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto">
        {result}
      </pre>
    </div>
  );
}