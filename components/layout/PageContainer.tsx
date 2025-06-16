interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  spacing?: "tight" | "normal" | "loose";
}

export default function PageContainer({
  children,
  className = "",
  spacing = "normal",
}: PageContainerProps) {
  const spacingClasses = {
    tight: "mt-3", // ~1/4 inch (12px)
    normal: "mt-4", // ~1/3 inch (16px)
    loose: "mt-6", // ~1/2 inch (24px)
  };

  return (
    <div
      className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${spacingClasses[spacing]} ${className}`}
    >
      {children}
    </div>
  );
}
