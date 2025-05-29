"use client";

import { PlusIcon, CheckSquareIcon } from "lucide-react";

interface CreateTaskPlaceholderProps {
  onClick: () => void;
  taskCount: number;
  placeholderIndex: number;
}

export default function CreateTaskPlaceholder({ 
  onClick, 
  taskCount, 
  placeholderIndex 
}: CreateTaskPlaceholderProps) {
  const suggestions = [
    {
      emoji: "🧹",
      title: "Clean and prepare",
      description: "Set up cleaning tasks for your property"
    },
    {
      emoji: "🔧",
      title: "Maintenance check",
      description: "Schedule regular maintenance tasks"
    },
    {
      emoji: "🔍",
      title: "Property inspection",
      description: "Create inspection checklists"
    },
    {
      emoji: "📦",
      title: "Supply inventory",
      description: "Track supplies and restocking needs"
    }
  ];

  const suggestion = suggestions[placeholderIndex] || suggestions[0];

  return (
    <div 
      onClick={onClick}
      className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-pointer group flex flex-col items-center justify-center text-center min-h-[280px]"
    >
      <div className="w-12 h-12 bg-gray-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center mb-4 transition-colors">
        <PlusIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
      </div>
      
      <div className="mb-3">
        <span className="text-2xl mb-2 block">{suggestion.emoji}</span>
        <h3 className="font-semibold text-gray-700 group-hover:text-blue-700 mb-1 transition-colors">
          {suggestion.title}
        </h3>
        <p className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">
          {suggestion.description}
        </p>
      </div>

      <div className="mt-auto">
        <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 group-hover:bg-blue-600 group-hover:text-white text-gray-600 rounded-lg text-sm font-medium transition-colors">
          <PlusIcon className="w-4 h-4 mr-1" />
          Create Task
        </span>
      </div>
    </div>
  );
}