import * as React from "react";
import Link from "next/link";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "primary" 
    | "secondary"
    | "outline"
    | "destructive"
    | "danger"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  href?: string;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = "", 
    variant = "default", 
    size = "default", 
    isLoading = false,
    href,
    children,
    disabled,
    ...props 
  }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      default: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500", // Alias for default
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500",
      outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500",
      destructive: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
      danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500", // Alias for destructive
      ghost: "hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500",
      link: "text-blue-600 underline-offset-4 hover:underline focus-visible:ring-blue-500",
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 px-3 py-1.5 text-sm",
      md: "h-10 px-4 py-2", // Alias for default
      lg: "h-11 px-8 py-3 text-lg",
      icon: "h-10 w-10",
    };

    const buttonClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${
      isLoading ? "cursor-not-allowed" : ""
    } ${className}`;

    const content = (
      <>
        {isLoading && (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </>
    );

    // If href is provided, render as Link
    if (href) {
      return (
        <Link 
          href={href} 
          className={buttonClasses}
          {...(isLoading && { 'aria-disabled': true })}
        >
          {content}
        </Link>
      );
    }

    // Otherwise render as button
    return (
      <button
        className={buttonClasses}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export default Button;