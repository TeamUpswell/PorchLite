"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import PhotoUpload from "@/components/ui/PhotoUpload";
import {
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  User,
  Star,
  MessageSquare,
  Camera,
  Heart,
  Eye,
  EyeOff,
} from "lucide-react";

interface Property {
  id: string;
  name: string;
}

interface TripReportWizardProps {
  isOpen?: boolean;
  onClose?: () => void;
  property: Property;
  onComplete: () => void;
  editEntry?: any; // Add this for editing existing entries
}

const steps = [
  { id: 1, name: "Basic Info", icon: User },
  { id: 2, name: "Your Story", icon: MessageSquare },
  { id: 3, name: "Photos", icon: Camera },
  { id: 4, name: "Settings", icon: Eye },
];

export default function TripReportWizard({
  isOpen = true,
  onClose,
  property,
  onComplete,
  editEntry, // Add this
}: TripReportWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data with edit entry if provided
  const [formData, setFormData] = useState({
    guestName: editEntry?.guest_name || "",
    visitDate: editEntry?.visit_date || "",
    rating: editEntry?.rating || 5,
    title: editEntry?.title || "",
    message: editEntry?.message || "",
    photos:
      editEntry?.photos?.map((url: string, index: number) => ({
        url,
        caption: editEntry?.photo_captions?.[index] || "",
      })) || [],
    everythingWasGreat: editEntry?.everything_was_great || false,
    everythingWellStocked: editEntry?.everything_well_stocked || false,
    isPublic: editEntry?.is_public ?? true,
    allowContact: false,
  });

  // If used as modal and not open, return null
  if (isOpen === false) return null;

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitForm = async () => {
    try {
      setIsSubmitting(true);

      const photoUrls = formData.photos.map((p) => p.url);
      const photoCaptions = formData.photos.map((p) => p.caption);

      if (editEntry) {
        // Update existing entry
        const { data: entry, error } = await supabase
          .from("guest_book_entries")
          .update({
            guest_name: formData.guestName,
            visit_date: formData.visitDate,
            rating: formData.rating,
            title: formData.title,
            message: formData.message,
            photos: photoUrls,
            photo_captions: photoCaptions,
            everything_was_great: formData.everythingWasGreat,
            everything_well_stocked: formData.everythingWellStocked,
            is_public: formData.isPublic,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editEntry.id)
          .select()
          .single();

        if (error) throw error;
      } else {
        // Create new entry
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { data: entry, error } = await supabase
          .from("guest_book_entries")
          .insert({
            property_id: property.id,
            created_by: user?.id,
            guest_name: formData.guestName,
            visit_date: formData.visitDate,
            rating: formData.rating,
            title: formData.title,
            message: formData.message,
            photos: photoUrls,
            photo_captions: photoCaptions,
            everything_was_great: formData.everythingWasGreat,
            everything_well_stocked: formData.everythingWellStocked,
            is_public: formData.isPublic,
            is_approved: false,
          })
          .select()
          .single();

        if (error) throw error;
      }

      onComplete();
      onClose?.();

      // Reset form only if creating new entry
      if (!editEntry) {
        setCurrentStep(1);
        setFormData({
          guestName: "",
          visitDate: "",
          rating: 5,
          title: "",
          message: "",
          photos: [],
          everythingWasGreat: false,
          everythingWellStocked: false,
          isPublic: true,
          allowContact: false,
        });
      }
    } catch (error) {
      console.error("Error submitting guest book entry:", error);
      alert("There was an error submitting your entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.guestName.trim() && formData.visitDate && formData.rating > 0
        );
      case 2:
        return formData.title.trim() && formData.message.trim();
      case 3:
        return true; // Photos are optional
      case 4:
        return true; // Settings have defaults
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep data={formData} updateData={updateFormData} />;
      case 2:
        return <StoryStep data={formData} updateData={updateFormData} />;
      case 3:
        return (
          <PhotosStep
            data={formData}
            updateData={updateFormData}
            property={property}
          />
        );
      case 4:
        return <SettingsStep data={formData} updateData={updateFormData} />;
      default:
        return null;
    }
  };

  const modalContent = (
    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
      {/* Modal Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {editEntry ? "Edit Your Memory" : "Share Your Memory"}
          </h2>
          <p className="text-sm text-gray-600">{property.name}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Progress Steps */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-center">
          {steps.map((step, stepIdx) => (
            <div key={step.name} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                    step.id < currentStep
                      ? "bg-blue-600 text-white"
                      : step.id === currentStep
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step.id < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <span className="mt-2 text-xs font-medium text-gray-600">
                  {step.name}
                </span>
              </div>
              {stepIdx < steps.length - 1 && (
                <div className="mx-4 w-12">
                  <div
                    className={`h-0.5 ${
                      step.id < currentStep ? "bg-blue-300" : "bg-gray-300"
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal Body */}
      <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
        {renderStep()}
      </div>

      {/* Modal Footer */}
      <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            currentStep === 1
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100"
          }`}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </button>

        {currentStep === steps.length ? (
          <button
            onClick={submitForm}
            disabled={!isStepValid() || isSubmitting}
            className={`inline-flex items-center px-6 py-2 text-sm font-medium rounded-md transition-colors ${
              !isStepValid() || isSubmitting
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Heart className="h-4 w-4 mr-2" />
                Share Memory
              </>
            )}
          </button>
        ) : (
          <button
            onClick={nextStep}
            disabled={!isStepValid()}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              !isStepValid()
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        )}
      </div>
    </div>
  );

  // If onClose is provided, show as modal with backdrop
  if (onClose) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        {modalContent}
      </div>
    );
  }

  // Otherwise show as page content
  return modalContent;
}

// Step components remain the same...
function BasicInfoStep({ data, updateData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Tell us about yourself and your visit
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name *
            </label>
            <input
              type="text"
              value={data.guestName}
              onChange={(e) => updateData({ guestName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="How should we remember you?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visit Date *
            </label>
            <input
              type="date"
              value={data.visitDate}
              onChange={(e) => updateData({ visitDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Overall Rating *
          </label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => updateData({ rating })}
                className="focus:outline-none"
              >
                <Star
                  className={`h-8 w-8 ${
                    rating <= data.rating
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
            <span className="ml-3 text-sm text-gray-600">
              {data.rating} out of 5 stars
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoryStep({ data, updateData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Share your story
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Give your memory a title *
            </label>
            <input
              type="text"
              value={data.title}
              onChange={(e) => updateData({ title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 'Perfect weekend getaway' or 'Unforgettable family time'"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tell us about your experience *
            </label>
            <textarea
              value={data.message}
              onChange={(e) => updateData({ message: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What made your stay special? Any favorite moments, discoveries, or recommendations for future guests?"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={data.everythingWasGreat}
                onChange={(e) =>
                  updateData({ everythingWasGreat: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Everything was perfect! ✨
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={data.everythingWellStocked}
                onChange={(e) =>
                  updateData({ everythingWellStocked: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Everything was well stocked 📦
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotosStep({ data, updateData, property }: any) {
  const handlePhotosChange = (
    newPhotos: { url: string; caption: string }[]
  ) => {
    updateData({ photos: newPhotos });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Add photos (optional)
        </h3>
        <p className="text-gray-600 mb-6">
          Share your favorite moments from your stay!
        </p>

        <PhotoUpload
          photos={data.photos}
          onPhotosChange={handlePhotosChange}
          maxPhotos={10}
          bucketName="guest-photos"
          folderPath={`${property.id}/guest-book`}
          showCaptions={true}
          className="w-full"
        />

        {data.photos.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              📸 You've added {data.photos.length} photo
              {data.photos.length === 1 ? "" : "s"}! These will help future
              guests see what makes this place special.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsStep({ data, updateData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Privacy settings
        </h3>

        <div className="space-y-4">
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={data.isPublic}
              onChange={(e) => updateData({ isPublic: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
            />
            <div className="ml-3">
              <span className="text-sm font-medium text-gray-700 flex items-center">
                {data.isPublic ? (
                  <Eye className="h-4 w-4 mr-1" />
                ) : (
                  <EyeOff className="h-4 w-4 mr-1" />
                )}
                Make this entry public
              </span>
              <p className="text-sm text-gray-500">
                Other guests will be able to see your review and photos
              </p>
            </div>
          </label>

          <label className="flex items-start">
            <input
              type="checkbox"
              checked={data.allowContact}
              onChange={(e) => updateData({ allowContact: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
            />
            <div className="ml-3">
              <span className="text-sm font-medium text-gray-700">
                Allow property owners to contact me
              </span>
              <p className="text-sm text-gray-500">
                Owners may reach out with questions or thank you messages
              </p>
            </div>
          </label>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Ready to share your memory!
          </h4>
          <p className="text-sm text-blue-800">
            Your entry will be reviewed by the property owners before being
            published. Thank you for taking the time to share your experience!
          </p>
        </div>
      </div>
    </div>
  );
}
