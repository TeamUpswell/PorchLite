"use client";

import { useState } from "react";
import { PencilIcon, ChevronUpIcon, ChevronDownIcon, TrashIcon } from "@heroicons/react/24/outline";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
// Use type-only import
import type { ManualItem as ManualItemType } from "@/types/manual";

// Define props interface with the complete type
interface ManualItemProps {
  item: ManualItemType; // Use the fully-typed version
  onEdit?: (item: ManualItemType) => void;
  onDelete?: (itemId: string) => void;
}

export default function ManualItem({ item, onEdit, onDelete }: ManualItemProps) {
  const [expanded, setExpanded] = useState(item.important);
  
  return (
    <div className={`${item.important ? 'bg-yellow-50' : ''}`}>
      <div 
        className={`px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 ${item.important ? 'hover:bg-yellow-100' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          {item.important && (
            <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2" />
          )}
          <h3 className={`font-medium ${item.important ? 'text-yellow-800' : ''}`}>
            {item.title}
          </h3>
        </div>
        
        <div className="flex items-center">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="p-1 rounded-md text-gray-500 hover:bg-gray-200 mr-1"
              title="Edit item"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Are you sure you want to delete this item?")) {
                  onDelete(item.id);
                }
              }}
              className="p-1 rounded-md text-gray-500 hover:bg-gray-200 hover:text-red-500 mr-1"
              title="Delete item"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
          
          <div className="ml-1 text-gray-500">
            {expanded ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{item.content}</ReactMarkdown>
          </div>
          
          {item.media_urls && item.media_urls.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {item.media_urls.map((url, idx) => (
                <div key={idx} className="rounded-md overflow-hidden relative h-48">
                  <Image 
                    src={url} 
                    alt={`Image for ${item.title}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover" 
                  />
                </div>
              ))}
            </div>
          )}

          {expanded && item.title.includes("Recommendations") && (
            <div className="mt-4 bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-700">
                ℹ️ Pro tip: Ask us for the latest recommendations! Our favorites change with the seasons.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}