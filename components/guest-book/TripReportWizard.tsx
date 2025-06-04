"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import StandardCard from "@/components/ui/StandardCard";
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Camera, 
  MapPin, 
  AlertTriangle,
  Package,
  Heart,
  Check
} from "lucide-react";
import BasicInfoStep from "./BasicInfoStep";
import PhotosStep from "./PhotosStep";

interface TripReportWizardProps {
  property: any;
  onComplete: () => void;
}

interface FormData {
  // Basic Info
  guestName: string;
  guestEmail: string;
  visitDate: string;
  rating: number;
  title: string;
  message: string;
  
  // Photos
  photos: File[];
  photoCaptions: string[];
  
  // Recommendations
  recommendations: {
    placeName: string;
    placeType: string;
    location: string;
    rating: number;
    notes: string;
    wouldRecommend: boolean;
  }[];
  
  // Issues
  issues: {
    issueType: string;
    description: string;
    location: string;
    priority: string;
    photo?: File;
  }[];
  
  // Inventory Notes
  inventoryNotes: {
    itemName: string;
    noteType: string;
    notes: string;
    quantityUsed?: number;
  }[];
}

const STEPS = [
  { id: 'basic', title: 'Your Stay', icon: Heart },
  { id: 'photos', title: 'Photos', icon: Camera },
  { id: 'recommendations', title: 'Places', icon: MapPin },
  { id: 'issues', title: 'Issues', icon: AlertTriangle },
  { id: 'supplies', title: 'Supplies', icon: Package },
  { id: 'review', title: 'Review', icon: Check }
];

export default function TripReportWizard({ property, onComplete }: TripReportWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    guestName: '',
    guestEmail: '',
    visitDate: '',
    rating: 5,
    title: '',
    message: '',
    photos: [],
    photoCaptions: [],
    recommendations: [],
    issues: [],
    inventoryNotes: []
  });

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!property?.id) {
      toast.error("Property not found");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create guest book entry
      const { data: guestBookEntry, error: entryError } = await supabase
        .from('guest_book_entries')
        .insert({
          property_id: property.id,
          guest_name: formData.guestName,
          guest_email: formData.guestEmail,
          visit_date: formData.visitDate,
          rating: formData.rating,
          title: formData.title,
          message: formData.message,
          is_public: true,
          is_approved: false // Requires owner approval
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // 2. Upload and save photos
      if (formData.photos.length > 0) {
        for (let i = 0; i < formData.photos.length; i++) {
          const file = formData.photos[i];
          const fileName = `guest-photos/${guestBookEntry.id}/${Date.now()}-${i}.jpg`;
          
          const { error: uploadError } = await supabase.storage
            .from('properties')
            .upload(fileName, file);

          if (!uploadError) {
            const { data: publicUrl } = supabase.storage
              .from('properties')
              .getPublicUrl(fileName);

            await supabase
              .from('guest_photos')
              .insert({
                guest_book_entry_id: guestBookEntry.id,
                photo_url: publicUrl.publicUrl,
                caption: formData.photoCaptions[i] || '',
                sort_order: i
              });
          }
        }
      }

      // 3. Save recommendations
      if (formData.recommendations.length > 0) {
        await supabase
          .from('guest_recommendations')
          .insert(
            formData.recommendations.map(rec => ({
              guest_book_entry_id: guestBookEntry.id,
              ...rec
            }))
          );
      }

      // 4. Create tasks from issues
      if (formData.issues.length > 0) {
        for (const issue of formData.issues) {
          // Create task
          const { data: task, error: taskError } = await supabase
            .from('tasks')
            .insert({
              property_id: property.id,
              title: `Guest Report: ${issue.issueType}`,
              description: issue.description,
              location: issue.location,
              priority: issue.priority,
              status: 'pending',
              category: 'maintenance',
              created_by: 'guest',
              source: 'guest_report'
            })
            .select()
            .single();

          if (!taskError) {
            // Link to guest report
            await supabase
              .from('guest_reported_issues')
              .insert({
                guest_book_entry_id: guestBookEntry.id,
                task_id: task.id,
                issue_type: issue.issueType,
                description: issue.description,
                location: issue.location,
                priority: issue.priority
              });
          }
        }
      }

      // 5. Save inventory notes
      if (formData.inventoryNotes.length > 0) {
        await supabase
          .from('guest_inventory_notes')
          .insert(
            formData.inventoryNotes.map(note => ({
              guest_book_entry_id: guestBookEntry.id,
              item_name: note.itemName,
              note_type: note.noteType,
              notes: note.notes,
              quantity_used: note.quantityUsed
            }))
          );
      }

      toast.success("Thank you for sharing your experience!");
      onComplete();

    } catch (error) {
      console.error('Error submitting trip report:', error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'basic':
        return (
          <BasicInfoStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        );
      case 'photos':
        return (
          <PhotosStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        );
      case 'recommendations':
        return (
          <RecommendationsStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        );
      case 'issues':
        return (
          <IssuesStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        );
      case 'supplies':
        return (
          <SuppliesStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        );
      case 'review':
        return (
          <ReviewStep 
            formData={formData} 
            property={property}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2
                  ${isActive 
                    ? 'border-blue-500 bg-blue-500 text-white' 
                    : isCompleted 
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                  }
                `}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {index < STEPS.length - 1 && (
                  <div className={`h-px w-12 mx-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <StandardCard className="mb-6">
        {renderStep()}
      </StandardCard>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </button>

        {currentStep === STEPS.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        ) : (
          <button
            onClick={nextStep}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        )}
      </div>
    </div>
  );
}

// Placeholder components for the missing steps
const RecommendationsStep = ({ formData, updateFormData }: any) => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Places you visited</h2>
    <p className="text-gray-600">This step is coming soon...</p>
  </div>
);

const IssuesStep = ({ formData, updateFormData }: any) => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Report any issues</h2>
    <p className="text-gray-600">This step is coming soon...</p>
  </div>
);

const SuppliesStep = ({ formData, updateFormData }: any) => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Supplies feedback</h2>
    <p className="text-gray-600">This step is coming soon...</p>
  </div>
);

const ReviewStep = ({ formData, property }: any) => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Review your submission</h2>
    <p className="text-gray-600">This step is coming soon...</p>
  </div>
);