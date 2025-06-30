"use client";

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  children,
  className = ""
}: PageHeaderProps) {
  if (!title && !subtitle && !children) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children || (
          <>
            {title && (
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-gray-600 dark:text-gray-300">
                {subtitle}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}