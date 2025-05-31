"use client";

import React from "react";

interface FloatingActionContainerProps {
  children: React.ReactNode;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  className?: string;
}

const positionStyles = {
  "bottom-right": "bottom-6 right-6",
  "bottom-left": "bottom-6 left-6",
  "top-right": "top-6 right-6",
  "top-left": "top-6 left-6",
};

export default function FloatingActionContainer({
  children,
  position = "bottom-right",
  className = "",
}: FloatingActionContainerProps) {
  return (
    <div
      className={`fixed ${positionStyles[position]} z-40 flex flex-col space-y-3 ${className}`}
    >
      {children}
    </div>
  );
}
