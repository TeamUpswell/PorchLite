// components/recommendations/AddRecommendationForm.tsx
import { useState } from "react";
import { X } from "lucide-react";
import { NewRecommendation } from "@/types/recommendations";

interface AddRecommendationFormProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  hasCategoryManagePermission: boolean;
  onManageCategories: () => void;
  onPlaceSelect: (place: any) => void;
  onSubmit: (recommendation: NewRecommendation) => Promise<void>;
}

const AddRecommendationForm: React.FC<AddRecommendationFormProps> = ({
  isOpen,
  onClose,
  categories,
  onSubmit,
}) => {
  const [recommendation, setRecommendation] = useState<NewRecommendation>({
    name: "",
    category: "",
    address: "",
    description: "",
    website: "",
    phone_number: "",
    rating: 5,
    images: [""],
    is_recommended: true,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(recommendation);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Add New Recommendation</h2>
        <button onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Name"
          value={recommendation.name}
          onChange={(e) => setRecommendation({ ...recommendation, name: e.target.value })}
          required
          className="w-full px-3 py-2 border rounded"
        />
        
        <select
          value={recommendation.category}
          onChange={(e) => setRecommendation({ ...recommendation, category: e.target.value })}
          required
          className="w-full px-3 py-2 border rounded"
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <textarea
          placeholder="Description"
          value={recommendation.description}
          onChange={(e) => setRecommendation({ ...recommendation, description: e.target.value })}
          className="w-full px-3 py-2 border rounded"
          rows={3}
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRecommendationForm;