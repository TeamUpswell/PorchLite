"use client";

import { useState } from "react";
import { Plus, AlertTriangle, Trash2, Camera, Check } from "lucide-react";

interface IssuesStepProps {
  formData: {
    issues: {
      issueType: string;
      description: string;
      location: string;
      priority: string;
      photo?: File;
    }[];
    everythingWasGreat?: boolean; // Add this field
  };
  updateFormData: (updates: any) => void;
}

export default function IssuesStep({ formData, updateFormData }: IssuesStepProps) {
  const [newIssue, setNewIssue] = useState({
    issueType: 'maintenance',
    description: '',
    location: '',
    priority: 'medium',
    photo: undefined as File | undefined
  });

  const issueTypes = [
    { value: 'maintenance', label: 'Maintenance/Repair' },
    { value: 'cleanliness', label: 'Cleanliness' },
    { value: 'amenity', label: 'Amenity Issue' },
    { value: 'safety', label: 'Safety Concern' },
    { value: 'noise', label: 'Noise Issue' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: 'low', label: 'Low - Nice to fix', color: 'text-green-600' },
    { value: 'medium', label: 'Medium - Should fix soon', color: 'text-yellow-600' },
    { value: 'high', label: 'High - Needs immediate attention', color: 'text-red-600' }
  ];

  const addIssue = () => {
    if (!newIssue.description.trim()) return;
    
    // If adding an issue, clear the "everything was great" flag
    updateFormData({
      issues: [...formData.issues, newIssue],
      everythingWasGreat: false
    });
    
    setNewIssue({
      issueType: 'maintenance',
      description: '',
      location: '',
      priority: 'medium',
      photo: undefined
    });
  };

  const removeIssue = (index: number) => {
    const updated = formData.issues.filter((_, i) => i !== index);
    updateFormData({ issues: updated });
  };

  const handleEverythingGreat = (isGreat: boolean) => {
    if (isGreat) {
      // Clear all issues if marking everything as great
      updateFormData({
        everythingWasGreat: true,
        issues: []
      });
    } else {
      updateFormData({
        everythingWasGreat: false
      });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewIssue(prev => ({ ...prev, photo: file }));
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Report any issues</h2>
        <p className="text-gray-600">
          Help the owners maintain their property by reporting any problems you noticed
        </p>
      </div>

      {/* Everything was great option */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={formData.everythingWasGreat || false}
            onChange={(e) => handleEverythingGreat(e.target.checked)}
            className="sr-only"
          />
          <div className={`flex items-center justify-center w-5 h-5 border-2 rounded mr-3 ${
            formData.everythingWasGreat 
              ? 'bg-green-500 border-green-500' 
              : 'border-gray-300'
          }`}>
            {formData.everythingWasGreat && (
              <Check className="h-3 w-3 text-white" />
            )}
          </div>
          <div>
            <span className="text-lg font-medium text-green-800">
              ✨ Everything was great - no issues to report!
            </span>
            <p className="text-sm text-green-700 mt-1">
              Check this if you had a perfect stay with no problems whatsoever
            </p>
          </div>
        </label>
      </div>

      {/* Only show issue reporting if not marked as "everything great" */}
      {!formData.everythingWasGreat && (
        <>
          {/* Notice */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800">
                  <strong>Optional but helpful:</strong> Issues you report will be converted into tasks for the property owners. 
                  This helps them keep the place in great condition for future guests.
                </p>
              </div>
            </div>
          </div>

          {/* Add New Issue */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Report an issue</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Type *
                </label>
                <select
                  value={newIssue.issueType}
                  onChange={(e) => setNewIssue(prev => ({ ...prev, issueType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {issueTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={newIssue.priority}
                  onChange={(e) => setNewIssue(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location in Property
              </label>
              <input
                type="text"
                value={newIssue.location}
                onChange={(e) => setNewIssue(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Master bedroom, Kitchen sink, Living room"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={newIssue.description}
                onChange={(e) => setNewIssue(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the issue in detail..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo (optional)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="issue-photo"
                />
                <label
                  htmlFor="issue-photo"
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {newIssue.photo ? 'Change Photo' : 'Add Photo'}
                </label>
                {newIssue.photo && (
                  <span className="text-sm text-gray-600">{newIssue.photo.name}</span>
                )}
              </div>
            </div>

            <button
              onClick={addIssue}
              disabled={!newIssue.description.trim()}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Issue
            </button>
          </div>
        </>
      )}

      {/* Existing Issues */}
      {formData.issues.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Reported Issues ({formData.issues.length})
          </h3>
          
          {formData.issues.map((issue, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-gray-900 capitalize">
                    {issue.issueType.replace('_', ' ')}
                  </h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {issue.location && <span>📍 {issue.location}</span>}
                    <span className={priorities.find(p => p.value === issue.priority)?.color}>
                      {priorities.find(p => p.value === issue.priority)?.label}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeIssue(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <p className="text-sm text-gray-700 mb-2">{issue.description}</p>
              
              {issue.photo && (
                <div className="flex items-center text-sm text-gray-600">
                  <Camera className="h-4 w-4 mr-1" />
                  Photo attached: {issue.photo.name}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Show appropriate empty state */}
      {formData.issues.length === 0 && !formData.everythingWasGreat && (
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No issues reported yet.</p>
        </div>
      )}

      {formData.everythingWasGreat && (
        <div className="text-center py-8 text-green-600">
          <Check className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-medium">Perfect! No issues to report. 🎉</p>
        </div>
      )}
    </div>
  );
}