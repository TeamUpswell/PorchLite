// app/layout.tsx - Fixed Version
import "./globals.css";
import "@/lib/global-debug"; // ✅ Add this line
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider"; // ✅ Direct import to enhanced version
import { PropertyProvider } from "@/lib/hooks/useProperty";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "react-hot-toast";
import Script from "next/script";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import UnifiedSessionManager from "@/components/system/UnifiedSessionManager";
import { Metadata, Viewport } from "next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PorchLite - Property Management",
    template: "%s | PorchLite",
  },
  description:
    "Streamlined property management platform for modern property owners",
  keywords: [
    "property management",
    "rental management",
    "property maintenance",
    "tenant management",
  ],
  authors: [{ name: "PorchLite Team" }],
  creator: "PorchLite",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "PorchLite",
    title: "PorchLite - Property Management",
    description:
      "Streamlined property management platform for modern property owners",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PorchLite - Property Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PorchLite - Property Management",
    description:
      "Streamlined property management platform for modern property owners",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2937" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://maps.googleapis.com" />

        {/* DNS prefetch for faster resource loading */}
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />

        {/* Prevent flash of unstyled content */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        className={`${inter.className} bg-gray-900 font-sans antialiased`}
        suppressHydrationWarning
      >
        <PageErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <PropertyProvider>
                <UnifiedSessionManager />
                {children}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: "#363636",
                      color: "#fff",
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: "#10b981",
                        secondary: "#fff",
                      },
                    },
                    error: {
                      duration: 5000,
                      iconTheme: {
                        primary: "#ef4444",
                        secondary: "#fff",
                      },
                    },
                  }}
                />
              </PropertyProvider>
            </AuthProvider>
          </ThemeProvider>
        </PageErrorBoundary>

        {/* Google Maps API - Simplified without event handlers */}
        <Script
          id="google-maps"
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
