import { AuthProvider } from "@/components/auth";
import { PropertyProvider } from "@/lib/hooks/useProperty";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata = {
  title: "PorchLite",
  description: "Property management made simple",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="bg-gray-900 text-white min-h-screen"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            <PropertyProvider>{children}</PropertyProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
