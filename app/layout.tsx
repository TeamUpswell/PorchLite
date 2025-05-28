import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { TenantProvider } from "@/lib/hooks/useTenant"; // Fix: Import TenantProvider, not useTenant
import { PropertyProvider } from "@/lib/hooks/useProperty";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Stia",
  description: "Shared Property Management",
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
            <TenantProvider>
              <PropertyProvider>
                {children}
                <Toaster />
              </PropertyProvider>
            </TenantProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
