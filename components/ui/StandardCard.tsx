// components/ui/StandardCard.tsx
"use client";

import * as React from "react";

interface StandardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

const StandardCard = React.forwardRef<HTMLDivElement, StandardCardProps>(
  ({ className = "", title, subtitle, icon, children, ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
      {...props}
    >
      {(title || subtitle || icon) && (
        <div className="p-6 pb-4">
          <div className="flex items-center space-x-2">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <div>
              {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}
      <div className="p-6 pt-0">{children}</div>
    </div>
  )
);

StandardCard.displayName = "StandardCard";

export default StandardCard;
