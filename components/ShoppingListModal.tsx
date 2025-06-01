"use client";

import React from "react";
import { X } from "lucide-react";
import { ShoppingListGenerator } from "./inventory/ShoppingListGenerator";
import { useProperty } from "@/lib/hooks/useProperty";

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
}

export default function ShoppingListModal({
  isOpen,
  onClose,
  items,
}: ShoppingListModalProps) {
  const { currentProperty } = useProperty();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Shopping List Generator</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <ShoppingListGenerator
            items={items}
            propertyName={currentProperty?.name}
            propertyAddress={currentProperty?.address}
          />
        </div>
      </div>
    </div>
  );
}
