import Link from "next/link";
import Image from "next/image";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
      {children}
    </div>
  );
}
