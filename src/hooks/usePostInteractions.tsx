import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PostInteractionState {
  isLiked: boolean;
  isReposted: boolean;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
}

export interface PostInteractionActions {
  toggleLike: (postId: string) => Promise<void>;
  toggleRepost: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string, parentId?: string) => Promise<void>;
  loadingStates: Record<string, boolean>;
}

export function usePostInteractions(): PostInteractionActions {
  const queryClient = useQueryClient();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Helper to set loading state
  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  // Like/Unlike mutation
  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { data, error } = await supabase.rpc('toggle_post_like', {
        post_id_param: postId
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data, postId) => {
      // Update the post in all relevant queries
      const updatePost = (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((post: any) =>
          post.id === postId
            ? {
                ...post,
                isLiked: data.is_liked,
                likes_count: data.likes_count
              }
            : post
        );
      };

      queryClient.setQueryData(['posts'], updatePost);
      queryClient.setQueryData(['user-posts'], updatePost);
      queryClient.setQueryData(['post', postId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          isLiked: data.is_liked,
          likes_count: data.likes_count
        };
      });
    },
    onError: (error: any) => {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like status');
    },
  });

  // Repost/Un-repost mutation
  const repostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { data, error } = await supabase.rpc('toggle_post_repost', {
        post_id_param: postId
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data, postId) => {
      // Update the post in all relevant queries
      const updatePost = (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((post: any) =>
          post.id === postId
            ? {
                ...post,
                isReposted: data.is_reposted,
                reposts_count: data.reposts_count
              }
            : post
        );
      };

      queryClient.setQueryData(['posts'], updatePost);
      queryClient.setQueryData(['user-posts'], updatePost);
      queryClient.setQueryData(['post', postId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          isReposted: data.is_reposted,
          reposts_count: data.reposts_count
        };
      });

      if (data.is_reposted) {
        toast.success('Post reposted to your profile');
      }
    },
    onError: (error: any) => {
      console.error('Error toggling repost:', error);
      toast.error('Failed to repost');
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async ({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) => {
      const { data, error } = await supabase.rpc('create_comment', {
        post_id_param: postId,
        content_param: content,
        parent_id_param: parentId || null
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data, { postId }) => {
      // Update comments count in all relevant queries
      const updatePost = (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((post: any) =>
          post.id === postId
            ? {
                ...post,
                comments_count: data.comments_count
              }
            : post
        );
      };

      queryClient.setQueryData(['posts'], updatePost);
      queryClient.setQueryData(['user-posts'], updatePost);
      queryClient.setQueryData(['post', postId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          comments_count: data.comments_count
        };
      });

      // Invalidate comments query to refresh the comments list
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      
      toast.success('Comment added successfully');
    },
    onError: (error: any) => {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    },
  });

  // Action functions
  const toggleLike = useCallback(async (postId: string) => {
    const loadingKey = `like-${postId}`;
    setLoading(loadingKey, true);
    try {
      await likeMutation.mutateAsync(postId);
    } finally {
      setLoading(loadingKey, false);
    }
  }, [likeMutation, setLoading]);

  const toggleRepost = useCallback(async (postId: string) => {
    const loadingKey = `repost-${postId}`;
    setLoading(loadingKey, true);
    try {
      await repostMutation.mutateAsync(postId);
    } finally {
      setLoading(loadingKey, false);
    }
  }, [repostMutation, setLoading]);

  const addComment = useCallback(async (postId: string, content: string, parentId?: string) => {
    const loadingKey = `comment-${postId}`;
    setLoading(loadingKey, true);
    try {
      await commentMutation.mutateAsync({ postId, content, parentId });
    } finally {
      setLoading(loadingKey, false);
    }
  }, [commentMutation, setLoading]);

  return {
    toggleLike,
    toggleRepost,
    addComment,
    loadingStates,
  };
}

// Hook for comment interactions
export function useCommentInteractions() {
  const queryClient = useQueryClient();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  // Comment like mutation
  const commentLikeMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { data, error } = await supabase.rpc('toggle_comment_like', {
        comment_id_param: commentId
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data, commentId) => {
      // Update comment in comments query
      queryClient.setQueryData(['comments'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((comment: any) =>
          comment.id === commentId
            ? {
                ...comment,
                isLiked: data.is_liked,
                likes_count: data.likes_count
              }
            : comment
        );
      });
    },
    onError: (error: any) => {
      console.error('Error toggling comment like:', error);
      toast.error('Failed to update like status');
    },
  });

  const toggleCommentLike = useCallback(async (commentId: string) => {
    const loadingKey = `comment-like-${commentId}`;
    setLoading(loadingKey, true);
    try {
      await commentLikeMutation.mutateAsync(commentId);
    } finally {
      setLoading(loadingKey, false);
    }
  }, [commentLikeMutation, setLoading]);

  return {
    toggleCommentLike,
    loadingStates,
  };
}
