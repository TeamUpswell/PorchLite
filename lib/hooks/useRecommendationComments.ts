// lib/hooks/useRecommendationComments.ts
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

interface Comment {
  id: string;
  recommendation_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
}

export function useRecommendationComments(recommendationId: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch comments for recommendation
  const fetchComments = async () => {
    try {
      setLoading(true);
      
      // First try with profiles join
      let { data, error } = await supabase
        .from('recommendation_notes')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq('recommendation_id', recommendationId)
        .order('created_at', { ascending: false });

      // If profiles join fails, try without it
      if (error && error.message.includes('profiles')) {
        console.log('Profiles table not found, fetching comments without user info');
        const { data: basicData, error: basicError } = await supabase
          .from('recommendation_notes')
          .select('*')
          .eq('recommendation_id', recommendationId)
          .order('created_at', { ascending: false });

        if (basicError) throw basicError;
        data = basicData;
      } else if (error) {
        throw error;
      }

      const commentsWithUserInfo = data?.map(comment => ({
        ...comment,
        user_name: comment.profiles?.full_name || comment.profiles?.email || 'Anonymous User',
        user_email: comment.profiles?.email
      })) || [];

      setComments(commentsWithUserInfo);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  // Add new comment
  const addComment = async (content: string) => {
    if (!user || !content.trim()) return { success: false, error: 'Invalid input' };

    try {
      setSubmitting(true);

      const { data, error } = await supabase
        .from('recommendation_notes')
        .insert([{
          recommendation_id: recommendationId,
          user_id: user.id,
          content: content.trim()
        }])
        .select()
        .single();

      if (error) throw error;

      const newComment = {
        ...data,
        user_name: user.email || 'Anonymous User',
        user_email: user.email
      };

      setComments(prev => [newComment, ...prev]);
      return { success: true, data: newComment };
    } catch (error) {
      console.error('Error adding comment:', error);
      return { success: false, error: error.message };
    } finally {
      setSubmitting(false);
    }
  };

  // Delete comment (only if user owns it)
  const deleteComment = async (commentId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('recommendation_notes')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // Only allow deleting own comments

      if (error) throw error;

      setComments(prev => prev.filter(comment => comment.id !== commentId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting comment:', error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    if (recommendationId) {
      fetchComments();
    }
  }, [recommendationId]);

  return {
    comments,
    loading,
    submitting,
    addComment,
    deleteComment,
    refreshComments: fetchComments
  };
}