"use client";

interface PageWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function PageWrapper({
  children,
  title,
  subtitle,
  actions,
}: PageWrapperProps) {
  return (
    <div className="space-y-6">
      {/* Page header */}
      {(title || actions) && (
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            )}
            {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {actions && (
            <div className="flex items-center space-x-3">{actions}</div>
          )}
        </div>
      )}

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}
