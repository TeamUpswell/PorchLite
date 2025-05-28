"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { supabase } from "@/lib/supabase";
import { useProperty } from "@/lib/hooks/useProperty";
import { ArrowLeft, Upload, X } from "lucide-react";
import { toast } from "react-hot-toast";

const SEVERITY_LEVELS = [
  { id: "Low", label: "Low", color: "bg-blue-100 text-blue-800" },
  { id: "Medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { id: "High", label: "High", color: "bg-red-100 text-red-800" }
];

const LOCATIONS = [
  "Kitchen",
  "Living Room",
  "Master Bedroom",
  "Guest Bedroom",
  "Master Bathroom",
  "Guest Bathroom",
  "Hallway",
  "Outdoor Area",
  "Other"
];

export default function ReportIssue() {
  const { user } = useAuth();
  const router = useRouter();
  const { currentProperty } = useProperty();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [issueData, setIssueData] = useState({
    description: "",
    severity: "Medium",
    location: "",
    notes: ""
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setIssueData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newPhotos = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setPhotos(prev => [...prev, ...newPhotos]);
  };
  
  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadPhotos = async () => {
    if (!photos.length) return [];
    
    setUploading(true);
    const uploadedUrls = [];
    
    try {
      for (const photo of photos) {
        const fileExt = photo.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `cleaning-issues/${fileName}`;
        
        const { error } = await supabase.storage
          .from('cleaning-photos')
          .upload(filePath, photo.file);
          
        if (error) throw error;
        
        // Get public URL
        const { data } = supabase.storage
          .from('cleaning-photos')
          .getPublicUrl(filePath);
          
        uploadedUrls.push(data.publicUrl);
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Failed to upload one or more photos');
      throw error;
    } finally {
      setUploading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !currentProperty) {
      toast.error('You must be logged in and have a property selected');
      return;
    }
    
    if (!issueData.description || !issueData.severity || !issueData.location) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      // First upload photos if any
      const photoUrls = await uploadPhotos();
      
      // Then create the issue record
      const { error } = await supabase
        .from('cleaning_issues')
        .insert([
          {
            property_id: currentProperty.id, // ✅ Use currentProperty.id
            description: issueData.description,
            severity: issueData.severity,
            location: issueData.location,
            photo_urls: photoUrls,
            reported_by: user.id,
            notes: issueData.notes
          }
        ]);
        
      if (error) throw error;
      
      toast.success('Issue reported successfully');
      router.push('/cleaning/issues');
    } catch (error) {
      console.error('Error reporting issue:', error);
      toast.error('Failed to report issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href="/cleaning/issues" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Issues
          </Link>
        </div>
        
        {/* ✅ Add property validation: */}
        {!currentProperty ? (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">No Property Selected</h2>
            <p className="text-gray-600">
              Please select a property from your account settings to report issues.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold mb-6">
              {currentProperty.name} - Report Cleaning Issue
            </h1>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={issueData.description}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the issue in detail"
                  />
                </div>
                
                {/* Location & Severity (side by side on larger screens) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Location dropdown */}
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                      Location *
                    </label>
                    <select
                      id="location"
                      name="location"
                      value={issueData.location}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select location</option>
                      {LOCATIONS.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Severity selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Severity *
                    </label>
                    <div className="flex space-x-4">
                      {SEVERITY_LEVELS.map(level => (
                        <label key={level.id} className="flex items-center">
                          <input
                            type="radio"
                            name="severity"
                            value={level.id}
                            checked={issueData.severity === level.id}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <div 
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              issueData.severity === level.id 
                                ? level.color + ' ring-2 ring-offset-2 ring-gray-500'
                                : 'bg-gray-100 text-gray-800'
                            } cursor-pointer`}
                          >
                            {level.label}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photos (Optional)
                  </label>
                  
                  <div className="flex flex-wrap gap-4 mb-3">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative w-24 h-24">
                        <img 
                          src={photo.preview} 
                          alt={`Preview ${index}`}
                          className="w-24 h-24 object-cover rounded-md border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-500"
                    >
                      <Upload className="h-8 w-8 mb-1" />
                      <span className="text-xs">Add Photo</span>
                    </button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Upload photos of the issue to help with resolution
                  </p>
                </div>
                
                {/* Additional Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={issueData.notes}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any other details we should know?"
                  />
                </div>
                
                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || uploading}
                    className={`px-4 py-2 rounded-md text-white font-medium ${
                      loading || uploading 
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {loading || uploading ? (
                      <div className="flex items-center">
                        <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                        {uploading ? 'Uploading Photos...' : 'Submitting...'}
                      </div>
                    ) : 'Submit Issue Report'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}