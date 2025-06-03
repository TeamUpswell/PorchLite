import Link from "next/link";
import Image from "next/image";
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - PorchLite",
  description: "Sign in, sign up, or reset your password",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/images/logo-dark.png"
            alt="PorchLite"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="text-xl font-bold text-gray-900">PorchLite</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
