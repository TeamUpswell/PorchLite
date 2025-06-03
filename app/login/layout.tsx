import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login - PorchLite",
  description: "Login to your PorchLite account",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Auth form */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-8">
        <div className="w-full max-w-md">
          <Link href="/">
            <div className="flex items-center mb-8">
              <Image
                src="/logo.png"
                alt="PorchLite Logo"
                width={40}
                height={40}
                className="mr-2"
              />
              <h1 className="text-2xl font-bold">PorchLite</h1>
            </div>
          </Link>

          {children}
        </div>
      </div>

      {/* Right side - Image or branding (hidden on mobile) */}
      <div className="hidden lg:block lg:w-1/2 bg-blue-600">
        <div className="h-full flex items-center justify-center p-12">
          <div className="max-w-xl text-white">
            <h2 className="text-3xl font-bold mb-6">
              Manage your properties with ease
            </h2>
            <p className="text-xl opacity-90">
              Streamline operations, improve communication, and boost efficiency
              with PorchLite.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
