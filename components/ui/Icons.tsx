// components/ui/Icons.tsx
import { PencilIcon as HeroPencilIcon, TrashIcon as HeroTrashIcon } from "@heroicons/react/24/outline";

interface IconProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4", 
  lg: "h-5 w-5"
};

export function PencilIcon({ className = "", size = "md" }: IconProps) {
  return (
    <HeroPencilIcon 
      className={`${sizeClasses[size]} ${className}`}
    />
  );
}

export function TrashIcon({ className = "", size = "md" }: IconProps) {
  return (
    <HeroTrashIcon 
      className={`${sizeClasses[size]} ${className}`}
    />
  );
}

// Standardized action buttons with built-in colors
interface ActionButtonProps {
  onClick: () => void;
  title: string;
  'aria-label'?: string;  // Add this line
  variant: "edit" | "delete";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ActionButton({ 
  onClick, 
  title, 
  'aria-label': ariaLabel,  // Add this parameter
  variant, 
  size = "md",
  className = "" 
}: ActionButtonProps) {
  const baseClasses = "p-1 transition-colors";
  
  // Standardized colors: blue for edit, red for delete
  const variantClasses = {
    edit: "text-blue-600 hover:text-blue-900",
    delete: "text-red-600 hover:text-red-900"
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      title={title}
      aria-label={ariaLabel || title}  // Add this line
    >
      {variant === "edit" ? (
        <PencilIcon size={size} />
      ) : (
        <TrashIcon size={size} />
      )}
    </button>
  );
}