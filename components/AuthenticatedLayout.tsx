"use client";

import { useAuth } from "@/components/AuthProvider";
import SideNavigation from "@/components/SideNavigation"; // Remove /layout/
import Script from "next/script";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  if (!user) {
    return null; // Or a loading state
  }

  return (
    <div className="flex min-h-screen">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=Function.prototype`}
        strategy="afterInteractive"
      />
      <SideNavigation user={user} />
      <main className="flex-1 md:ml-0 pt-16 md:pt-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
