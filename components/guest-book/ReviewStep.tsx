"use client";

import { useEffect, useState } from "react";
import { Star, Camera, MapPin, AlertTriangle, Package, Calendar, User, Mail, X } from "lucide-react";

interface ReviewStepProps {
  formData: {
    guestName: string;
    guestEmail: string;
    visitDate: string;
    rating: number;
    title: string;
    message: string;
    photos: File[];
    photoCaptions: string[];
    recommendations: any[];
    issues: any[];
    inventoryNotes: any[];
    everythingWasGreat?: boolean;
    everythingWellStocked?: boolean;
  };
  property: any;
}

export default function ReviewStep({ formData, property }: ReviewStepProps) {
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

  // Create preview URLs for photos
  useEffect(() => {
    const urls: string[] = [];
    
    formData.photos.forEach((file) => {
      const url = URL.createObjectURL(file);
      urls.push(url);
    });
    
    setPhotoPreviewUrls(urls);

    // Cleanup function to revoke URLs when component unmounts
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [formData.photos]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Submission</h2>
        <p className="text-gray-600">Please review your trip report before submitting</p>
      </div>

      {/* Property Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-1">Submitting for:</h3>
        <p className="text-blue-800">{property?.name || 'Property'}</p>
      </div>

      {/* Basic Info */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
          <User className="h-5 w-5 mr-2" />
          Your Stay Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Guest Name:</span>
            <p className="text-gray-900">{formData.guestName}</p>
          </div>
          
          {formData.guestEmail && (
            <div>
              <span className="font-medium text-gray-700">Email:</span>
              <p className="text-gray-900">{formData.guestEmail}</p>
            </div>
          )}
          
          <div>
            <span className="font-medium text-gray-700">Visit Date:</span>
            <p className="text-gray-900 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date(formData.visitDate).toLocaleDateString()}
            </p>
          </div>
          
          <div>
            <span className="font-medium text-gray-700">Rating:</span>
            <div className="flex items-center">
              {renderStars(formData.rating)}
              <span className="ml-2 text-gray-900">{formData.rating}/5</span>
            </div>
          </div>
        </div>

        {formData.title && (
          <div className="mt-4">
            <span className="font-medium text-gray-700">Title:</span>
            <p className="text-gray-900">{formData.title}</p>
          </div>
        )}

        {formData.message && (
          <div className="mt-4">
            <span className="font-medium text-gray-700">Your Experience:</span>
            <p className="text-gray-900 mt-1">{formData.message}</p>
          </div>
        )}
      </div>

      {/* Photos */}
      {formData.photos.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            Photos ({formData.photos.length})
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {photoPreviewUrls.map((url, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={url} 
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {formData.photoCaptions[index] && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2 rounded-b-lg">
                    {formData.photoCaptions[index]}
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
          
          {/* Show file names and sizes */}
          <div className="mt-3 space-y-1">
            {formData.photos.map((photo, index) => (
              <div key={index} className="text-xs text-gray-500 flex justify-between">
                <span>{photo.name}</span>
                <span>{(photo.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {formData.recommendations.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Recommendations ({formData.recommendations.length})
          </h3>
          
          <div className="space-y-2">
            {formData.recommendations.map((rec, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{rec.name}</h4>
                    <p className="text-sm text-gray-600 capitalize">{rec.category}</p>
                    {rec.place_id && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 mt-1">
                        Google Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    {renderStars(rec.guest_rating)}
                    <span className="ml-1 text-sm text-gray-600">{rec.guest_rating}/5</span>
                  </div>
                </div>
                {rec.address && (
                  <p className="text-xs text-gray-600 mt-1">{rec.address}</p>
                )}
                {rec.guest_notes && (
                  <p className="text-sm text-gray-700 mt-2 italic">"{rec.guest_notes}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues */}
      {formData.everythingWasGreat ? (
        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
          <h3 className="text-lg font-medium text-green-900 mb-2 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Property Issues
          </h3>
          <div className="flex items-center text-green-800">
            <span className="text-2xl mr-2">✨</span>
            <span className="font-medium">Everything was great - no issues to report!</span>
          </div>
        </div>
      ) : formData.issues.length > 0 ? (
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Issues Reported ({formData.issues.length})
          </h3>
          
          <div className="space-y-2">
            {formData.issues.map((issue, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">
                      {issue.issueType.replace('_', ' ')}
                    </h4>
                    {issue.location && (
                      <p className="text-sm text-gray-600">📍 {issue.location}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    issue.priority === 'high' ? 'bg-red-100 text-red-800' :
                    issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {issue.priority} priority
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{issue.description}</p>
                {issue.photo && (
                  <p className="text-xs text-gray-500 mt-1">📷 Photo attached: {issue.photo.name}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Property Issues
          </h3>
          <p className="text-gray-600">No issues reported.</p>
        </div>
      )}

      {/* Supplies */}
      {formData.everythingWellStocked ? (
        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
          <h3 className="text-lg font-medium text-green-900 mb-2 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Supplies & Amenities
          </h3>
          <div className="flex items-center text-green-800">
            <span className="text-2xl mr-2">✨</span>
            <span className="font-medium">Everything was well-stocked!</span>
          </div>
        </div>
      ) : formData.inventoryNotes.length > 0 ? (
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Supply Notes ({formData.inventoryNotes.length})
          </h3>
          
          <div className="space-y-2">
            {formData.inventoryNotes.map((note, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{note.itemName}</h4>
                    <p className="text-sm text-gray-600 capitalize">
                      {note.noteType.replace('_', ' ')}
                    </p>
                  </div>
                  {note.quantityUsed && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Used: {note.quantityUsed}
                    </span>
                  )}
                </div>
                {note.notes && (
                  <p className="text-sm text-gray-700 mt-1">{note.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Supplies & Amenities
          </h3>
          <p className="text-gray-600">No supply notes added.</p>
        </div>
      )}

      {/* Submission Notice */}
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-amber-400 mr-2 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-800">Before you submit:</h4>
            <ul className="mt-1 text-sm text-amber-700 list-disc list-inside space-y-1">
              <li>Your entry will be reviewed by the property owners before appearing publicly</li>
              {formData.issues.length > 0 && (
                <li>Any issues you reported will be converted into tasks for the owners</li>
              )}
              {formData.inventoryNotes.length > 0 && (
                <li>Your supply notes will help owners maintain inventory</li>
              )}
              {formData.recommendations.length > 0 && (
                <li>Your recommendations will help future guests discover local gems</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}