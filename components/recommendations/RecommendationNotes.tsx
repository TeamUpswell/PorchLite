// components/recommendations/RecommendationNotes.tsx
import { useState } from "react";
import Image from "next/image";
import { MessageSquare } from "lucide-react";

interface RecommendationNote {
  id: string;
  recommendation_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

interface RecommendationNotesProps {
  recommendationId: string;
  recommendationName: string;
  notes: RecommendationNote[];
  onAddNote: (recommendationId: string, content: string) => Promise<void>;
}

const RecommendationNotes: React.FC<RecommendationNotesProps> = ({
  recommendationId,
  recommendationName,
  notes,
  onAddNote,
}) => {
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newNote.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddNote(recommendationId, newNote.trim());
      setNewNote("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t pt-3 mt-3">
      <h4 className="font-semibold flex items-center text-sm mb-2">
        <MessageSquare className="h-4 w-4 mr-1" />
        Notes ({notes.length})
      </h4>

      {/* Notes List */}
      <div className="space-y-3 mb-3 max-h-40 overflow-y-auto">
        {notes.map((note) => (
          <div key={note.id} className="text-sm bg-gray-50 p-2 rounded">
            <div className="flex items-center gap-2 mb-1">
              {note.user_avatar ? (
                <div className="flex-shrink-0 h-6 w-6 relative rounded-full overflow-hidden">
                  <Image
                    src={note.user_avatar}
                    alt={note.user_name || "User avatar"}
                    fill
                    sizes="24px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-800 flex-shrink-0">
                  {note.user_name?.charAt(0) || "?"}
                </div>
              )}
              <span className="font-medium">{note.user_name}</span>
              <span className="text-xs text-gray-500">
                {new Date(note.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-700 pl-8">{note.content}</p>
          </div>
        ))}

        {notes.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            No notes yet. Be the first to add one!
          </p>
        )}
      </div>

      {/* Add Note Input */}
      <div className="flex items-center mt-2">
        <label htmlFor={`note-input-${recommendationId}`} className="sr-only">
          Add a note for {recommendationName}
        </label>
        <input
          id={`note-input-${recommendationId}`}
          type="text"
          placeholder="Add a note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSubmitting}
          className="flex-1 text-sm border rounded-l-md py-1 px-2 disabled:bg-gray-100"
        />
        <button
          onClick={handleSubmit}
          disabled={!newNote.trim() || isSubmitting}
          className="bg-blue-500 text-white text-sm py-1 px-3 rounded-r-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          aria-label={`Add note to ${recommendationName}`}
        >
          {isSubmitting ? "..." : "Add"}
        </button>
      </div>
    </div>
  );
};

export default RecommendationNotes;
