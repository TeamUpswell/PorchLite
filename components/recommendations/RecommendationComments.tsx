// components/recommendations/RecommendationComments.tsx
"use client";

import { useState } from 'react';
import { MessageCircle, Send, Trash2, User } from 'lucide-react';
import { useRecommendationComments } from '@/lib/hooks/useRecommendationComments';
import { useAuth } from '@/components/AuthProvider';

interface RecommendationCommentsProps {
  recommendationId: string;
  recommendationName: string;
}

export default function RecommendationComments({ 
  recommendationId, 
  recommendationName 
}: RecommendationCommentsProps) {
  const { user } = useAuth();
  const { comments, loading, submitting, addComment, deleteComment } = useRecommendationComments(recommendationId);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    const result = await addComment(newComment);
    
    if (result.success) {
      setNewComment('');
    } else {
      alert(`Failed to add comment: ${result.error}`);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    const result = await deleteComment(commentId);
    
    if (!result.success) {
      alert(`Failed to delete comment: ${result.error}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  return (
    <div className="border-t border-gray-100 pt-4 mt-4">
      {/* Comments Toggle */}
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
        <MessageCircle className="h-4 w-4 mr-1" />
        {comments.length > 0 ? `${comments.length} comment${comments.length !== 1 ? 's' : ''}` : 'Add comment'}
      </button>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 space-y-4">
          {/* Add Comment Form */}
          {user ? (
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={`Share your thoughts about ${recommendationName}...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                rows={3}
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {newComment.length}/500 characters
                </span>
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-3 w-3 mr-1" />
                      Post
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-3 text-sm text-gray-600 bg-gray-50 rounded-lg">
              <MessageCircle className="h-5 w-5 mx-auto mb-1 text-gray-400" />
              <p>Sign in to leave a comment</p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                        <User className="h-3 w-3 text-blue-600" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 text-sm">
                          {comment.user_name}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Delete button for comment owner */}
                    {user && comment.user_id === user.id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                <MessageCircle className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                <p>No comments yet</p>
                {user && (
                  <p className="text-xs mt-1">Be the first to share your thoughts!</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}