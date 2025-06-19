// app/layout.tsx - SHOULD ONLY LOOK LIKE THIS
import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth";
import { PropertyProvider } from "@/lib/hooks/useProperty";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "react-hot-toast";
import Script from "next/script";
import { PageErrorBoundary } from "@/components/PageErrorBoundary"; // ✅ ADD
import SessionRecovery from "@/components/system/SessionRecovery";
import { withSessionRetry } from '@/lib/api-helpers';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "PorchLite - Property Management",
  description: "Streamlined property management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900`}>
        <ThemeProvider>
          <AuthProvider>
            <PropertyProvider>
              <PageErrorBoundary>
                <SessionRecovery />
                {children}
              </PageErrorBoundary>
              <Toaster position="top-right" />
            </PropertyProvider>
          </AuthProvider>
        </ThemeProvider>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}

// Import the helper
// import { withSessionRetry } from '@/lib/api-helpers';

// Update one of your API functions as an example
// const fetchUpcomingVisits = async (propertyId: string): Promise<UpcomingVisit[]> => {
//   try {
//     const today = new Date().toISOString().split("T")[0];
    
//     const result = await withSessionRetry(() => 
//       supabase
//         .from("reservations")
//         .select("id, title, start_date, end_date, status")
//         .eq("property_id", propertyId)
//         .gte("start_date", today)
//         .order("start_date", { ascending: true })
//         .limit(10)
//     );
    
//     if (result.error) {
//       console.error("Error fetching visits:", result.error);
//       return [];
//     }
    
//     return result.data || [];
//   } catch (error) {
//     console.error("Exception fetching visits:", error);
//     return [];
//   }
// };

// Similarly update your other API functions
