// app/layout.tsx - SHOULD ONLY LOOK LIKE THIS
import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth";
import { PropertyProvider } from "@/lib/hooks/useProperty";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "react-hot-toast";
import Script from "next/script";
import ErrorBoundary from "@/components/ErrorBoundary";
import ClientErrorTracker from "@/components/ClientErrorTracker";
import AuthStateMonitor from "@/components/AuthStateMonitor";

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
          <ClientErrorTracker />
          <ErrorBoundary>
            <AuthProvider>
              <AuthStateMonitor />
              <PropertyProvider>
                {children} {/* ✅ ONLY THIS - NO OTHER COMPONENTS */}
                <Toaster position="top-right" />
              </PropertyProvider>
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
