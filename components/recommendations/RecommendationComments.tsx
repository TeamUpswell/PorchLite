// components/recommendations/RecommendationComments.tsx
"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth";
import { toast } from "react-hot-toast";

interface Comment {
  id: string;
  content: string; // ← Changed from 'comment' to 'content'
  created_at: string;
  user_id: string;
  recommendation_id: string;
  profiles?: {
    id: string;
    email: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
  };
}

interface RecommendationCommentsProps {
  recommendationId: string;
  recommendationName: string;
}

export default function RecommendationComments({
  recommendationId,
  recommendationName,
}: RecommendationCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Fetch comments with user data - FIXED QUERY
  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("recommendation_notes") // ← Correct table name
        .select(
          `
          *,
          profiles!user_id(id, email, full_name, first_name, last_name)
        `
        ) // ← Fixed relationship syntax
        .eq("recommendation_id", recommendationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [recommendationId, showComments]);

  // Helper function to get display name
  const getUserDisplayName = (comment: Comment): string => {
    if (!comment.profiles) return "Unknown User";

    const { profiles: userData } = comment;

    // Try full_name first
    if (userData.full_name?.trim()) {
      return userData.full_name.trim();
    }

    // Try first_name + last_name
    if (userData.first_name || userData.last_name) {
      const firstName = userData.first_name?.trim() || "";
      const lastName = userData.last_name?.trim() || "";
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName) return fullName;
    }

    // Fall back to email (first part before @)
    if (userData.email) {
      return userData.email.split("@")[0];
    }

    return "Unknown User";
  };

  // Add new comment
  const addComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("recommendation_notes") // ← Correct table name
        .insert([
          {
            recommendation_id: recommendationId,
            user_id: user.id,
            content: newComment.trim(), // ← Changed from 'comment' to 'content'
          },
        ])
        .select(
          `
          *,
          profiles!user_id(id, email, full_name, first_name, last_name)
        `
        )
        .single();

      if (error) throw error;

      setComments((prev) => [data, ...prev]);
      setNewComment("");
      toast.success("Comment added!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setLoading(false);
    }
  };

  // Delete comment
  const deleteComment = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;

    try {
      const { error } = await supabase
        .from("recommendation_notes") // ← Correct table name
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        {comments.length > 0 ? `${comments.length} Comments` : "Add Comment"}
      </button>

      {showComments && (
        <div className="mt-3 space-y-3">
          {/* Add Comment Form */}
          {user && (
            <div className="flex items-start space-x-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={`Add a comment about ${recommendationName}...`}
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
              />
              <button
                onClick={addComment}
                disabled={!newComment.trim() || loading}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          )}

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-gray-50 rounded-lg p-3 text-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {getUserDisplayName(comment)}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {new Date(comment.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>{" "}
                      {/* ← Changed from comment.comment to comment.content */}
                    </div>

                    {/* Delete button - only show for comment author */}
                    {user && comment.user_id === user.id && (
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors ml-2"
                        title="Delete comment"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">
              No comments yet. Be the first to share your thoughts!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
