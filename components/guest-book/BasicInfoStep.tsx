"use client";

import { Star } from "lucide-react";

interface BasicInfoStepProps {
  formData: {
    guestName: string;
    guestEmail: string;
    visitDate: string;
    rating: number;
    title: string;
    message: string;
  };
  updateFormData: (updates: any) => void;
}

export default function BasicInfoStep({ formData, updateFormData }: BasicInfoStepProps) {
  const handleRatingClick = (rating: number) => {
    updateFormData({ rating });
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about your stay</h2>
        <p className="text-gray-600">Share some basic information about your visit</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Guest Name */}
        <div>
          <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 mb-2">
            Your Name *
          </label>
          <input
            type="text"
            id="guestName"
            value={formData.guestName}
            onChange={(e) => updateFormData({ guestName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your name"
            required
          />
        </div>

        {/* Guest Email */}
        <div>
          <label htmlFor="guestEmail" className="block text-sm font-medium text-gray-700 mb-2">
            Email (optional)
          </label>
          <input
            type="email"
            id="guestEmail"
            value={formData.guestEmail}
            onChange={(e) => updateFormData({ guestEmail: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your@email.com"
          />
        </div>
      </div>

      {/* Visit Date */}
      <div>
        <label htmlFor="visitDate" className="block text-sm font-medium text-gray-700 mb-2">
          Visit Date *
        </label>
        <input
          type="date"
          id="visitDate"
          value={formData.visitDate}
          onChange={(e) => updateFormData({ visitDate: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Overall Rating *
        </label>
        <div className="flex items-center space-x-1">
          {Array.from({ length: 5 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleRatingClick(i + 1)}
              className={`p-1 rounded transition-colors ${
                i < formData.rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
              }`}
            >
              <Star className={`h-8 w-8 ${i < formData.rating ? 'fill-current' : ''}`} />
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-600">
            {formData.rating > 0 && `${formData.rating} star${formData.rating !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title for your review (optional)
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Amazing weekend getaway!"
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
          Your experience
        </label>
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) => updateFormData({ message: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tell us about your stay, what you loved, and any memorable moments..."
        />
      </div>
    </div>
  );
}