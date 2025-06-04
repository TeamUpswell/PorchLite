"use client";

import { useState } from "react";
import { Plus, Package, Trash2, AlertCircle, Check } from "lucide-react";

interface SuppliesStepProps {
  formData: {
    inventoryNotes: {
      itemName: string;
      noteType: string;
      notes: string;
      quantityUsed?: number;
    }[];
    everythingWellStocked?: boolean; // Add this field
  };
  updateFormData: (updates: any) => void;
}

export default function SuppliesStep({ formData, updateFormData }: SuppliesStepProps) {
  const [newNote, setNewNote] = useState({
    itemName: '',
    noteType: 'low_stock',
    notes: '',
    quantityUsed: undefined as number | undefined
  });

  const noteTypes = [
    { value: 'low_stock', label: 'Running Low', icon: '⚠️' },
    { value: 'missing', label: 'Missing/Empty', icon: '❌' },
    { value: 'damaged', label: 'Damaged', icon: '🔧' },
    { value: 'suggestion', label: 'Suggestion for New Item', icon: '💡' }
  ];

  const commonItems = [
    'Toilet Paper', 'Paper Towels', 'Dish Soap', 'Laundry Detergent',
    'Shampoo', 'Body Soap', 'Coffee', 'Trash Bags', 'Batteries',
    'Cleaning Supplies', 'Towels', 'Bed Linens'
  ];

  const addNote = () => {
    if (!newNote.itemName.trim()) return;
    
    // If adding a note, clear the "everything well-stocked" flag
    updateFormData({
      inventoryNotes: [...formData.inventoryNotes, newNote],
      everythingWellStocked: false
    });
    
    setNewNote({
      itemName: '',
      noteType: 'low_stock',
      notes: '',
      quantityUsed: undefined
    });
  };

  const removeNote = (index: number) => {
    const updated = formData.inventoryNotes.filter((_, i) => i !== index);
    updateFormData({ inventoryNotes: updated });
  };

  const handleEverythingWellStocked = (isWellStocked: boolean) => {
    if (isWellStocked) {
      // Clear all notes if marking everything as well-stocked
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Supplies & Amenities</h2>
        <p className="text-gray-600">
          Help the owners keep the place well-stocked by letting them know about supplies
        </p>
      </div>

      {/* Everything was well-stocked option */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={formData.everythingWellStocked || false}
            onChange={(e) => handleEverythingWellStocked(e.target.checked)}
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
              Check this if all supplies and amenities were perfectly stocked during your stay
            </p>
          </div>
        </label>
      </div>

      {/* Only show supply notes if not marked as "everything well-stocked" */}
      {!formData.everythingWellStocked && (
        <>
          {/* Notice */}
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-green-800">
                  <strong>Helpful but optional:</strong> Your feedback helps owners maintain inventory 
                  and ensure future guests have everything they need.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Select Common Items */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Quick select common items:</h3>
            <div className="flex flex-wrap gap-2">
              {commonItems.map(item => (
                <button
                  key={item}
                  onClick={() => setQuickItem(item)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Add New Note */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Add supply note</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Note Type
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
            </div>

            {(newNote.noteType === 'low_stock' || newNote.noteType === 'missing') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity Used (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newNote.quantityUsed || ''}
                  onChange={(e) => setNewNote(prev => ({ 
                    ...prev, 
                    quantityUsed: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="How many did you use?"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={newNote.notes}
                onChange={(e) => setNewNote(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional details or suggestions..."
              />
            </div>

            <button
              onClick={addNote}
              disabled={!newNote.itemName.trim()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </button>
          </div>
        </>
      )}

      {/* Existing Notes */}
      {formData.inventoryNotes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Supply Notes ({formData.inventoryNotes.length})
          </h3>
          
          {formData.inventoryNotes.map((note, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{note.itemName}</h4>
                  <div className="flex items-center text-sm text-gray-600">
                    {noteTypes.find(t => t.value === note.noteType)?.icon}{' '}
                    {noteTypes.find(t => t.value === note.noteType)?.label}
                    {note.quantityUsed && (
                      <span className="ml-2">• Used: {note.quantityUsed}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeNote(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              {note.notes && (
                <p className="text-sm text-gray-700">{note.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Show appropriate empty state */}
      {formData.inventoryNotes.length === 0 && !formData.everythingWellStocked && (
        <div className="text-center py-8 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No supply notes added yet.</p>
        </div>
      )}

      {formData.everythingWellStocked && (
        <div className="text-center py-8 text-green-600">
          <Check className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-medium">Perfect! Everything was well-stocked. 🎉</p>
        </div>
      )}
    </div>
  );
}