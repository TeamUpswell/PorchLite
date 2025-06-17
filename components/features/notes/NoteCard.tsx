import React from 'react';
import { ActionButton } from '@/components/ui/Icons';

// Define the props for the NoteCard component
interface NoteCardProps {
  note: {
    id: string;
    title: string;
    content: string;
    created_at: string;
  };
  onEdit: () => void; // Function to handle editing the note
  onDelete: (id: string) => void; // Function to handle deleting the note
}

// NoteCard component for displaying individual notes
export default function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">{note.title}</h3>
          <p className="text-gray-600">{note.content}</p>
        </div>
        <div className="flex space-x-2">
          <ActionButton
            onClick={onEdit}
            title="Edit note"
            aria-label={`Edit ${note.title}`}
            variant="edit"
          />
          <ActionButton
            onClick={() => onDelete(note.id)}
            title="Delete note"
            aria-label={`Delete ${note.title}`}
            variant="delete"
          />
        </div>
      </div>
      <div className="text-xs text-gray-500">
        {new Date(note.created_at).toLocaleDateString()}
      </div>
    </div>
  );
}