interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function DashboardLayout({ 
  children, 
  className = "" 
}: DashboardLayoutProps) {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  );
}
