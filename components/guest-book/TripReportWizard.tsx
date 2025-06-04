"use client";

import { useState } from "react";
import { Heart, Camera, MapPin, AlertTriangle, Package, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Add this import
import BasicStep from "./BasicInfoStep";
import PhotosStep from "./PhotosStep";
import RecommendationsStep from "./RecommendationsStep";
import IssuesStep from "./IssuesStep";
import SuppliesStep from "./SuppliesStep";
import ReviewStep from "./ReviewStep";

interface FormData {
  guestName: string;
  guestEmail: string;
  visitDate: string;
  numberOfNights: number;
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
}

const STEPS = [
  { id: 'basic', title: 'Your Stay', icon: Heart },
  { id: 'photos', title: 'Photos', icon: Camera },
  { id: 'recommendations', title: 'Places', icon: MapPin },
  { id: 'issues', title: 'Issues', icon: AlertTriangle },
  { id: 'supplies', title: 'Supplies', icon: Package },
  { id: 'review', title: 'Review', icon: Check }
];

interface TripReportWizardProps {
  property: any;
  onComplete: (result: any) => void;
}

export default function TripReportWizard({ property, onComplete }: TripReportWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    guestName: "",
    guestEmail: "",
    visitDate: "",
    numberOfNights: 1,
    rating: 5,
    title: "",
    message: "",
    photos: [],
    photoCaptions: [],
    recommendations: [],
    issues: [],
    inventoryNotes: [],
    everythingWasGreat: false,
    everythingWellStocked: false,
  });

  // Initialize Supabase client
  const supabase = createClientComponentClient();

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep === 0) {
      // Basic step validation
      if (!formData.guestName.trim()) {
        alert("Please enter your name");
        return;
      }
      if (!formData.visitDate) {
        alert("Please select your visit date");
        return;
      }
      if (!formData.numberOfNights || formData.numberOfNights < 1) {
        alert("Please select the number of nights");
        return;
      }
      if (formData.rating === 0) {
        alert("Please provide a rating");
        return;
      }
      if (!formData.message.trim()) {
        alert("Please share your experience");
        return;
      }
    }
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitForm = async () => {
    try {
      setIsSubmitting(true);

      // Upload photos first
      const uploadedPhotoUrls: string[] = [];
      for (let i = 0; i < formData.photos.length; i++) {
        const photo = formData.photos[i];
        const fileExt = photo.name.split('.').pop();
        const fileName = `${property.id}/${Date.now()}-${i}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('guest-photos')
          .upload(fileName, photo);

        if (uploadError) {
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('guest-photos')
          .getPublicUrl(fileName);
        
        uploadedPhotoUrls.push(publicUrlData.publicUrl);
      }

      // Create guest book entry
      const { data: guestBookEntry, error: guestBookError } = await supabase
        .from('guest_book_entries')
        .insert({
          property_id: property.id,
          guest_name: formData.guestName,
          guest_email: formData.guestEmail,
          visit_date: formData.visitDate,
          number_of_nights: formData.numberOfNights,
          rating: formData.rating,
          title: formData.title,
          message: formData.message,
          photos: uploadedPhotoUrls,
          photo_captions: formData.photoCaptions,
          status: 'pending',
          everything_was_great: formData.everythingWasGreat || false,
          everything_well_stocked: formData.everythingWellStocked || false,
        })
        .select()
        .single();

      if (guestBookError) {
        throw new Error(`Guest book entry failed: ${guestBookError.message}`);
      }

      // Handle recommendations
      if (formData.recommendations.length > 0) {
        for (const rec of formData.recommendations) {
          let recommendationId = rec.existing_recommendation_id;

          // If it's a new recommendation, create it first
          if (rec.is_new_recommendation) {
            const { data: newRec, error: recError } = await supabase
              .from('recommendations')
              .insert({
                name: rec.name,
                category: rec.category,
                address: rec.address,
                coordinates: rec.coordinates,
                description: rec.description || `Recommended by ${formData.guestName}`,
                rating: rec.rating,
                website: rec.website,
                phone_number: rec.phone_number,
                place_id: rec.place_id,
                property_id: property.id,
                is_recommended: true,
                images: [],
              })
              .select()
              .single();

            if (recError) {
              console.error('Error creating recommendation:', recError);
              continue;
            }
            recommendationId = newRec.id;
          }

          // Create guest recommendation link
          if (recommendationId) {
            const { error: guestRecError } = await supabase
              .from('guest_recommendations')
              .insert({
                guest_book_entry_id: guestBookEntry.id,
                recommendation_id: recommendationId,
                guest_rating: rec.guest_rating,
                guest_notes: rec.guest_notes,
                place_name: rec.name,
                place_type: rec.category,
                location: rec.address,
                rating: rec.guest_rating,
                notes: rec.guest_notes,
              });

            if (guestRecError) {
              console.error('Error linking guest recommendation:', guestRecError);
            }
          }
        }
      }

      // Handle issues (only if not "everything was great")
      if (!formData.everythingWasGreat && formData.issues.length > 0) {
        for (const issue of formData.issues) {
          // Upload issue photo if exists
          let issuePhotoUrl = null;
          if (issue.photo) {
            const fileExt = issue.photo.name.split('.').pop();
            const fileName = `issues/${property.id}/${Date.now()}-${Math.random()}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('issue-photos')
              .upload(fileName, issue.photo);

            if (!uploadError) {
              const { data: publicUrlData } = supabase.storage
                .from('issue-photos')
                .getPublicUrl(fileName);
              issuePhotoUrl = publicUrlData.publicUrl;
            }
          }

          // Create task for property owner
          const { error: taskError } = await supabase
            .from('tasks')
            .insert({
              property_id: property.id,
              title: `${issue.issueType.replace('_', ' ')} - ${issue.location || 'Property'}`,
              description: issue.description,
              priority: issue.priority,
              status: 'todo',
              category: 'maintenance',
              location: issue.location,
              reported_by_guest: true,
              guest_book_entry_id: guestBookEntry.id,
              photos: issuePhotoUrl ? [issuePhotoUrl] : [],
              due_date: issue.priority === 'high' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
            });

          if (taskError) {
            console.error('Error creating task from issue:', taskError);
          }
        }
      }

      // Handle inventory notes (only if not "everything well-stocked")
      if (!formData.everythingWellStocked && formData.inventoryNotes.length > 0) {
        for (const note of formData.inventoryNotes) {
          const { error: inventoryError } = await supabase
            .from('inventory_notes')
            .insert({
              property_id: property.id,
              guest_book_entry_id: guestBookEntry.id,
              item_name: note.itemName,
              note_type: note.noteType,
              notes: note.notes,
              quantity_used: note.quantityUsed,
              guest_name: formData.guestName,
            });

          if (inventoryError) {
            console.error('Error creating inventory note:', inventoryError);
          }
        }
      }

      // Send notification email to property owner
      try {
        await fetch('/api/notifications/guest-book-entry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyId: property.id,
            guestName: formData.guestName,
            rating: formData.rating,
            hasIssues: !formData.everythingWasGreat && formData.issues.length > 0,
            hasRecommendations: formData.recommendations.length > 0,
            numberOfNights: formData.numberOfNights,
          }),
        });
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }

      // Success!
      onComplete({
        success: true,
        message: "Thank you for your wonderful review! Your entry has been submitted and will appear after owner approval.",
        entryId: guestBookEntry.id,
      });

    } catch (error) {
      console.error('Submission error:', error);
      setIsSubmitting(false);
      
      alert(`Failed to submit your review: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <BasicStep formData={formData} updateFormData={updateFormData} />;
      case 1:
        return <PhotosStep formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <RecommendationsStep formData={formData} updateFormData={updateFormData} property={property} />;
      case 3:
        return <IssuesStep formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <SuppliesStep formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <ReviewStep formData={formData} property={property} />;
      default:
        return <BasicStep formData={formData} updateFormData={updateFormData} />;
    }
  };

  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isActive 
                      ? 'border-blue-600 bg-blue-600 text-white' 
                      : isCompleted
                      ? 'border-green-600 bg-green-600 text-white'
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`hidden sm:block w-16 h-px mx-4 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={isFirstStep}
            className={`flex items-center px-6 py-3 rounded-lg ${
              isFirstStep
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </button>

          {isLastStep ? (
            <button
              onClick={submitForm}
              disabled={isSubmitting}
              className={`flex items-center px-6 py-3 rounded-lg ${
                isSubmitting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  Submit Review
                  <Check className="h-4 w-4 ml-2" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}