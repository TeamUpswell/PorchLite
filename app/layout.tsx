import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth";
import { PropertyProvider } from "@/lib/hooks/useProperty";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "react-hot-toast";
import MainLayout from "@/components/layout/MainLayout"; // ✅ Use your existing MainLayout

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
      </body>
    </html>
  );
}
