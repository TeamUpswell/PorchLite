"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface FloatingActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "gray";
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
  form?: string;
  className?: string;
}

const variantStyles = {
  primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500",
  secondary: "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 focus:ring-purple-500",
  success: "bg-green-600 hover:bg-green-700 active:bg-green-800 focus:ring-green-500",
  warning: "bg-orange-600 hover:bg-orange-700 active:bg-orange-800 focus:ring-orange-500",
  danger: "bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-red-500",
  gray: "bg-gray-600 hover:bg-gray-700 active:bg-gray-800 focus:ring-gray-500",
};

export default function FloatingActionButton({
  icon: Icon,
  label,
  onClick,
  href,
  variant = "primary",
  disabled = false,
  loading = false,
  type = "button",
  form,
  className = "",
}: FloatingActionButtonProps) {
  const baseClasses = `
    group flex items-center justify-center text-white shadow-lg transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-opacity-50 
    ${variantStyles[variant]}
    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
    w-14 h-14 rounded-full
    sm:w-auto sm:h-auto sm:px-4 sm:py-3 sm:rounded-lg sm:hover:scale-105
    ${className}
  `.trim();

  const iconClasses = "h-6 w-6 transition-transform duration-200 sm:mr-0 group-hover:sm:mr-2";
  
  const getIconAnimation = () => {
    switch (variant) {
      case "success":
        return "group-hover:rotate-12";
      case "gray":
        return "group-hover:-translate-x-1";
      case "danger":
        return "group-hover:scale-110";
      default:
        return "group-hover:rotate-90";
    }
  };

  const buttonContent = (
    <>
      <Icon className={`${iconClasses} ${getIconAnimation()}`} />
      <span className="hidden sm:inline-block sm:w-0 sm:overflow-hidden sm:whitespace-nowrap sm:transition-all sm:duration-300 group-hover:sm:w-auto group-hover:sm:ml-2">
        {loading ? "Loading..." : label}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseClasses} aria-label={label}>
        {buttonContent}
      </Link>
    );
  }

  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled || loading}
      className={baseClasses}
      aria-label={label}
    >
      {buttonContent}
    </button>
  );
}