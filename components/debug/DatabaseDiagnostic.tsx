"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle, XCircle, AlertTriangle, Database } from "lucide-react";

interface DiagnosticResult {
  connection: boolean;
  connectionError?: string;
  tables: Record<string, { exists: boolean; count?: number; error?: string }>;
}

export default function DatabaseDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const TABLES_TO_CHECK = [
    'profiles', 'tenants', 'tenant_users', 'properties', 'reservations',
    'cleaning_tasks', 'inventory', 'contacts', 'manual_sections', 
    'manual_items', 'checklists', 'checklist_items', 'user_roles', 'notes'
  ];

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setIsLoading(true);
    const diagnostic: DiagnosticResult = {
      connection: false,
      tables: {}
    };

    try {
      // Test basic connection
      const { error: connectionError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      diagnostic.connection = !connectionError;
      if (connectionError) {
        diagnostic.connectionError = connectionError.message;
      }

      // Check each table
      for (const table of TABLES_TO_CHECK) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          diagnostic.tables[table] = {
            exists: !error,
            count: count || 0,
            error: error?.message
          };
        } catch (err: any) {
          diagnostic.tables[table] = {
            exists: false,
            error: err.message
          };
        }
      }

      setResults(diagnostic);
    } catch (error: any) {
      console.error('Diagnostic failed:', error);
      diagnostic.connectionError = error.message;
      setResults(diagnostic);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-700">Running diagnostics...</span>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-red-600 font-medium">
        Failed to run diagnostics
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center space-x-2">
        {results.connection ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
        <span className={`font-semibold ${
          results.connection ? 'text-green-800' : 'text-red-800'
        }`}>
          Database Connection: {results.connection ? 'Connected' : 'Failed'}
        </span>
      </div>

      {results.connectionError && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-sm text-red-800">
            <strong>Error:</strong> {results.connectionError}
          </p>
        </div>
      )}

      {/* Tables Status */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <Database className="h-4 w-4 mr-2" />
          Tables Status
        </h4>
        <div className="space-y-2">
          {Object.entries(results.tables).map(([tableName, tableResult]) => (
            <div key={tableName} className="flex items-center justify-between py-1">
              <div className="flex items-center space-x-2">
                {tableResult.exists ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="font-medium text-gray-900">{tableName}:</span>
                <span className={`text-sm ${
                  tableResult.exists ? 'text-green-800' : 'text-red-800'
                }`}>
                  {tableResult.exists ? 'Exists' : 'Missing'}
                </span>
              </div>
              
              {tableResult.exists && tableResult.count !== undefined && (
                <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
                  {tableResult.count} records
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-700">Tables Found: </span>
            <span className="font-semibold text-gray-900">
              {Object.values(results.tables).filter(t => t.exists).length}
            </span>
          </div>
          <div>
            <span className="text-gray-700">Total Tables: </span>
            <span className="font-semibold text-gray-900">
              {Object.keys(results.tables).length}
            </span>
          </div>
          <div>
            <span className="text-gray-700">Missing: </span>
            <span className="font-semibold text-red-800">
              {Object.values(results.tables).filter(t => !t.exists).length}
            </span>
          </div>
          <div>
            <span className="text-gray-700">Total Records: </span>
            <span className="font-semibold text-gray-900">
              {Object.values(results.tables)
                .filter(t => t.exists)
                .reduce((sum, t) => sum + (t.count || 0), 0)
                .toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={runDiagnostics}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
      >
        {isLoading ? 'Running...' : 'Refresh Diagnostics'}
      </button>
    </div>
  );
}