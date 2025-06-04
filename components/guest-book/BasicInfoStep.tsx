"use client";

import { Star, Calendar, User, Mail, MessageSquare, Heart } from "lucide-react";

interface BasicInfoStepProps {
  formData: {
    guestName: string;
    guestEmail: string;
    visitDate: string;
    numberOfNights: number; // Add this field
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
            <User className="inline h-4 w-4 mr-1" />
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
            <Mail className="inline h-4 w-4 mr-1" />
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
          <p className="text-xs text-gray-500 mt-1">
            Optional. Only visible to property owners, never shared publicly.
          </p>
        </div>
      </div>

      {/* Visit Date and Number of Nights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="visitDate" className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Visit Date *
          </label>
          <input
            type="date"
            id="visitDate"
            value={formData.visitDate}
            onChange={(e) => updateFormData({ visitDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            max={new Date().toISOString().split('T')[0]} // Can't select future dates
          />
        </div>

        <div>
          <label htmlFor="numberOfNights" className="block text-sm font-medium text-gray-700 mb-2">
            Number of Nights *
          </label>
          <div className="relative">
            <select
              id="numberOfNights"
              value={formData.numberOfNights}
              onChange={(e) => updateFormData({ numberOfNights: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              required
            >
              <option value="">Select nights</option>
              {Array.from({ length: 30 }, (_, i) => i + 1).map(nights => (
                <option key={nights} value={nights}>
                  {nights} night{nights !== 1 ? 's' : ''}
                </option>
              ))}
              <option value={31}>30+ nights</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Heart className="inline h-4 w-4 mr-1" />
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
            {formData.rating > 0 ? (
              <>
                {formData.rating} star{formData.rating !== 1 ? "s" : ""} - 
                {formData.rating === 5 && " Exceptional!"}
                {formData.rating === 4 && " Great!"}
                {formData.rating === 3 && " Good"}
                {formData.rating === 2 && " Fair"}
                {formData.rating === 1 && " Poor"}
              </>
            ) : (
              "Click to rate"
            )}
          </span>
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          <MessageSquare className="inline h-4 w-4 mr-1" />
          Title for your review (optional)
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Amazing weekend getaway!"
          maxLength={100}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Optional - helps summarize your experience</span>
          <span>{formData.title.length}/100</span>
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
          Your experience *
        </label>
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) => updateFormData({ message: e.target.value })}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Share your experience... What did you love about your stay? What made it special? Any highlights or memorable moments?"
          required
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Share the story of your stay - future guests will appreciate the details!</span>
          <span>{formData.message.length} characters</span>
        </div>
      </div>

      {/* Helpful Tips */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
        <div className="flex">
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">💡 What makes a great review?</h4>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Describe what made your stay special</li>
                <li>Mention the property's best features</li>
                <li>Share tips that would help future guests</li>
                <li>Be honest and specific about your experience</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}