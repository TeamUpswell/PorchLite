import { ReactNode, ButtonHTMLAttributes } from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  href?: string;
  className?: string;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  href,
  className = "",
  ...props
}: ButtonProps) {
  // Base classes
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-colors rounded-lg";

  // Size classes
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  // Variant classes
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    outline:
      "bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  // Combine classes
  const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${
    variantClasses[variant]
  } ${isLoading ? "opacity-70 cursor-not-allowed" : ""} ${className}`;

  // If href is provided, render as Link
  if (href) {
    return (
      <Link href={href} className={buttonClasses}>
        {isLoading ? (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
        ) : null}
        {children}
      </Link>
    );
  }

  // Otherwise render as button
  return (
    <button className={buttonClasses} disabled={isLoading} {...props}>
      {isLoading ? (
        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
      ) : null}
      {children}
    </button>
  );
}
