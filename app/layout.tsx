// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth";
import { PropertyProvider } from "@/lib/hooks/useProperty";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "react-hot-toast";
import MainLayout from "@/components/layout/MainLayout";
import { supabase } from '@/lib/supabase';
import Script from 'next/script'

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
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <PropertyProvider>
              {/* ✅ Use your existing MainLayout - it handles everything */}
              <MainLayout>{children}</MainLayout>

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
