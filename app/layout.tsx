import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth"; // Updated import path
import { PropertyProvider } from "@/lib/hooks/useProperty";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "react-hot-toast";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PorchLite - Property Management for Shared Spaces",
  description:
    "Professional property management platform designed for shared spaces and collaborative living",
  keywords: [
    "property management",
    "shared spaces",
    "collaborative living",
    "PorchLite",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>PorchLite</title>
        <meta
          name="description"
          content="PorchLite - Property Management Platform for Shared Spaces"
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <PropertyProvider>
              {children}
              <Toaster />
            </PropertyProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
