"use client";

import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { Route, ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface WalkthroughStep {
  id: number;
  title: string;
  description: string;
  tips?: string[];
  image?: string;
}

export default function WalkthroughPage() {
  const [currentStep, setCurrentStep] = useState(0);

  const walkthroughSteps: WalkthroughStep[] = [
    {
      id: 1,
      title: "Welcome & Entry",
      description: "Main entrance and key information",
      tips: [
        "Keys are in the lockbox - code sent via email",
        "WiFi password is on the kitchen counter",
        "Emergency contacts on the refrigerator",
      ],
    },
    {
      id: 2,
      title: "Kitchen & Dining",
      description: "Fully equipped kitchen with everything you need",
      tips: [
        "Coffee maker and pods provided",
        "Basic spices and cooking oil available",
        "Dishwasher - eco cycle recommended",
      ],
    },
    {
      id: 3,
      title: "Living Room",
      description: "Comfortable seating and entertainment center",
      tips: [
        "Smart TV with streaming services logged in",
        "Board games in the ottoman storage",
        "Fireplace - wood provided in winter",
      ],
    },
    {
      id: 4,
      title: "Bedrooms",
      description: "Comfortable sleeping arrangements",
      tips: [
        "Extra blankets in hall closet",
        "Blackout curtains for better sleep",
        "USB charging stations by each bed",
      ],
    },
    {
      id: 5,
      title: "Bathrooms",
      description: "Fresh towels and basic amenities provided",
      tips: [
        "Hair dryer under sink",
        "Basic toiletries provided",
        "Extra toilet paper in cabinet",
      ],
    },
    {
      id: 6,
      title: "Outdoor Spaces",
      description: "Deck, patio, and outdoor equipment",
      tips: [
        "Grill propane should be full",
        "Outdoor furniture cushions in storage box",
        "Garden hose for cleaning gear",
      ],
    },
  ];

  const nextStep = () => {
    if (currentStep < walkthroughSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = walkthroughSteps[currentStep];

  return (
    <StandardPageLayout
      title="House Walkthrough"
      subtitle="Get familiar with your vacation home"
      headerIcon={<Route className="h-6 w-6 text-blue-600" />}
      breadcrumb={[
        { label: "The House", href: "/house" },
        { label: "Walkthrough" },
      ]}
    >
      <div className="space-y-6">
        {/* Progress Bar */}
        <StandardCard>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep + 1} of {walkthroughSteps.length}</span>
              <span>{Math.round(((currentStep + 1) / walkthroughSteps.length) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / walkthroughSteps.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </StandardCard>

        {/* Current Step */}
        <StandardCard title={currentStepData.title}>
          <div className="space-y-6">
            {/* Step Image Placeholder */}
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Photo of {currentStepData.title}</p>
              </div>
            </div>

            {/* Step Description */}
            <div>
              <p className="text-gray-700 text-lg mb-4">{currentStepData.description}</p>
              
              {currentStepData.tips && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">💡 Helpful Tips:</h4>
                  <ul className="space-y-2">
                    {currentStepData.tips.map((tip, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  currentStep === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </button>

              <div className="flex space-x-2">
                {walkthroughSteps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentStep
                        ? "bg-blue-600"
                        : index < currentStep
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              {currentStep === walkthroughSteps.length - 1 ? (
                <Link
                  href="/house"
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Complete Tour
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              ) : (
                <button
                  onClick={nextStep}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              )}
            </div>
          </div>
        </StandardCard>
      </div>
    </StandardPageLayout>
  );
}