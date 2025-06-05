"use client";

import { useState } from "react";
import { Plus, Package, Trash2, AlertCircle, Check } from "lucide-react";

interface SuppliesStepProps {
  formData: {
    inventoryNotes: {
      itemName: string;
      noteType: string;
      notes: string;
    }[];
    everythingWellStocked?: boolean;
  };
  updateFormData: (updates: any) => void;
}

export default function SuppliesStep({ formData, updateFormData }: SuppliesStepProps) {
  const [newNote, setNewNote] = useState({
    itemName: '',
    noteType: 'missing',
    notes: '',
  });

  const noteTypes = [
    { value: 'missing', label: 'Missing/Empty', color: 'text-red-600', icon: '❌' },
    { value: 'low', label: 'Running Low', color: 'text-yellow-600', icon: '⚠️' },
    { value: 'suggestion', label: 'Suggestion', color: 'text-blue-600', icon: '💡' },
    { value: 'praise', label: 'Well Stocked', color: 'text-green-600', icon: '✅' }
  ];

  const commonItems = [
    'Toilet Paper', 'Paper Towels', 'Towels', 'Bed Sheets', 'Coffee', 'Tea',
    'Salt', 'Pepper', 'Cooking Oil', 'Dish Soap', 'Laundry Detergent',
    'Shampoo', 'Body Wash', 'Hand Soap', 'Cleaning Supplies', 'Trash Bags',
    'Light Bulbs', 'Batteries', 'First Aid Kit', 'Fire Extinguisher'
  ];

  const addNote = () => {
    if (!newNote.itemName.trim() || !newNote.notes.trim()) return;
    
    updateFormData({
      inventoryNotes: [...formData.inventoryNotes, newNote],
      everythingWellStocked: false
    });
    
    setNewNote({
      itemName: '',
      noteType: 'missing',
      notes: '',
    });
  };

  const removeNote = (index: number) => {
    const updated = formData.inventoryNotes.filter((_, i) => i !== index);
    updateFormData({ inventoryNotes: updated });
  };

  const handleEverythingStocked = (isWellStocked: boolean) => {
    if (isWellStocked) {
      updateFormData({
        everythingWellStocked: true,
        inventoryNotes: []
      });
    } else {
      updateFormData({
        everythingWellStocked: false
      });
    }
  };

  const setQuickItem = (itemName: string) => {
    setNewNote(prev => ({ ...prev, itemName }));
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Supplies & Inventory</h2>
        <p className="text-gray-600">
          Help the owners keep their property well-stocked for future guests
        </p>
      </div>

      {/* Everything well-stocked option */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={formData.everythingWellStocked || false}
            onChange={(e) => handleEverythingStocked(e.target.checked)}
            className="sr-only"
          />
          <div className={`flex items-center justify-center w-5 h-5 border-2 rounded mr-3 ${
            formData.everythingWellStocked 
              ? 'bg-green-500 border-green-500' 
              : 'border-gray-300'
          }`}>
            {formData.everythingWellStocked && (
              <Check className="h-3 w-3 text-white" />
            )}
          </div>
          <div>
            <span className="text-lg font-medium text-green-800">
              ✨ Everything was well-stocked!
            </span>
            <p className="text-sm text-green-700 mt-1">
              Check this if all supplies and amenities were adequately provided
            </p>
          </div>
        </label>
      </div>

      {/* Only show supply notes if not marked as "everything well-stocked" */}
      {!formData.everythingWellStocked && (
        <>
          {/* Add New Note */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Add a supply note</h3>
            
            {/* Quick select common items */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick select common items:
              </label>
              <div className="flex flex-wrap gap-2">
                {commonItems.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setQuickItem(item)}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                value={newNote.itemName}
                onChange={(e) => setNewNote(prev => ({ ...prev, itemName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Toilet Paper, Coffee, Towels"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note Type *
              </label>
              <select
                value={newNote.noteType}
                onChange={(e) => setNewNote(prev => ({ ...prev, noteType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {noteTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes *
              </label>
              <textarea
                value={newNote.notes}
                onChange={(e) => setNewNote(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the situation or your suggestion..."
              />
            </div>

            <button
              onClick={addNote}
              disabled={!newNote.itemName.trim() || !newNote.notes.trim()}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </button>
          </div>
        </>
      )}

      {/* Show notes or empty state */}
      {formData.inventoryNotes.length === 0 && !formData.everythingWellStocked ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No supply notes added yet.</p>
        </div>
      ) : formData.everythingWellStocked ? (
        <div className="text-center py-8 text-green-600">
          <Check className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-medium">Great! Everything was well-stocked. 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Supply Notes ({formData.inventoryNotes.length})
          </h3>
          
          {formData.inventoryNotes.map((note, index) => {
            const noteType = noteTypes.find(t => t.value === note.noteType);
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{note.itemName}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${noteType?.color || 'text-gray-600'}`}>
                        {noteType?.icon} {noteType?.label}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeNote(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <p className="text-sm text-gray-700">{note.notes}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Helpful Tips */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
        <div className="flex">
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">📦 Supply Tips</h4>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Note items that were completely missing or empty</li>
                <li>Mention supplies that were running low</li>
                <li>Suggest additional items that would enhance the stay</li>
                <li>Praise items that were well-stocked and appreciated</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}