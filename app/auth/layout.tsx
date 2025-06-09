import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Authentication - PorchLite",
  description: "Sign in to your PorchLite account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Auth form (light background) */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo (only visible on small screens) */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-block rounded-lg p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-radial from-amber-500/20 via-transparent to-transparent"></div>
              <Link
                href="/"
                className="flex items-center space-x-3 relative z-10"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-400 rounded-full blur-md opacity-30"></div>
                  <Image
                    src="/images/logo-dark.png"
                    alt="PorchLite Logo"
                    width={48}
                    height={48}
                    className="w-12 h-12 relative z-10"
                    priority
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">PorchLite</h1>
                  <p className="text-sm text-amber-200">Always Welcome</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Clean white form container */}
          <div className="bg-white rounded-lg shadow-lg p-8">{children}</div>
        </div>
      </div>

      {/* Right side - Dark branding (simplified) */}
      <div className="hidden lg:block lg:w-1/2 bg-gray-900">
        <div className="h-full flex flex-col items-center justify-center p-12">
          {/* Simplified logo section */}
          <div className="text-center mb-12">
            <div className="inline-block rounded-lg p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-radial from-amber-500/20 via-transparent to-transparent"></div>

              <Link
                href="/"
                className="flex items-center space-x-4 relative z-10"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-400 rounded-full blur-md opacity-30"></div>
                  <Image
                    src="/images/logo-dark.png"
                    alt="PorchLite Logo"
                    width={64}
                    height={64}
                    className="w-16 h-16 relative z-10"
                    priority
                  />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-white">PorchLite</h1>
                  <p className="text-amber-200">Always Welcome</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Simplified welcome message */}
          <div className="max-w-xl text-white text-center">
            <h2 className="text-3xl font-bold mb-6">Welcome Home</h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              Your vacation rental management platform where the light is always
              on.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
