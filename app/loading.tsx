// app/loading.tsx - Enhanced Global Loading Component
export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        {/* Spinner */}
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <div className="absolute inset-0 rounded-full h-12 w-12 border-4 border-transparent border-t-blue-400 animate-spin animate-reverse opacity-60"></div>
        </div>
        
        {/* Loading text */}
        <p className="mt-4 text-sm text-gray-600 animate-pulse">
          Loading...
        </p>
        
        {/* Optional: Brand or context */}
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          PorchLite
        </p>
      </div>
    </div>
  );
}