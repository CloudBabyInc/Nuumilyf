import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CommentCacheStrategy {
  // Hierarchical caching
  useHierarchicalCache: boolean;
  // Pagination settings
  pageSize: number;
  maxDepth: number;
  // Prefetch settings
  prefetchReplies: boolean;
  prefetchLikes: boolean;
}

interface OptimizedComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  depth: number;
  thread_path: string[];
  reply_count: number;
  likes_count: number;
  user_data: any;
  isLiked: boolean;
  children?: OptimizedComment[];
}

export function useOptimizedComments(
  postId: string,
  currentUserId?: string,
  strategy: Partial<CommentCacheStrategy> = {}
) {
  const queryClient = useQueryClient();
  
  const config = useMemo(() => ({
    useHierarchicalCache: true,
    pageSize: 20,
    maxDepth: 3,
    prefetchReplies: true,
    prefetchLikes: true,
    ...strategy
  }), [strategy]);

  // Main comments query with intelligent caching
  const {
    data: comments = [],
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useQuery({
    queryKey: ['optimized-comments', postId, config],
    queryFn: async ({ pageParam = 0 }) => {
      // Use the optimized database function
      const { data, error } = await supabase.rpc('get_threaded_comments', {
        post_id_param: postId,
        limit_param: config.pageSize,
        offset_param: pageParam * config.pageSize,
        max_depth: config.maxDepth
      });

      if (error) throw error;

      // Batch fetch user likes if enabled
      let userLikes: string[] = [];
      if (config.prefetchLikes && currentUserId && data.length > 0) {
        const commentIds = data.map(c => c.id);
        const { data: likesData } = await supabase.rpc('batch_get_comment_likes', {
          comment_ids: commentIds,
          user_id_param: currentUserId
        });
        
        userLikes = likesData?.filter(l => l.user_liked).map(l => l.comment_id) || [];
      }

      return data.map(comment => ({
        ...comment,
        user_data: typeof comment.user_data === 'string' 
          ? JSON.parse(comment.user_data) 
          : comment.user_data,
        isLiked: userLikes.includes(comment.id)
      })) as OptimizedComment[];
    },
    enabled: !!postId,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Hierarchical comment tree builder
  const commentTree = useMemo(() => {
    if (!config.useHierarchicalCache) return comments;

    const commentMap = new Map<string, OptimizedComment>();
    const rootComments: OptimizedComment[] = [];

    // First pass: create map
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, children: [] });
    });

    // Second pass: build tree
    comments.forEach(comment => {
      const commentNode = commentMap.get(comment.id)!;
      
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(commentNode);
        } else {
          rootComments.push(commentNode);
        }
      } else {
        rootComments.push(commentNode);
      }
    });

    return rootComments;
  }, [comments, config.useHierarchicalCache]);

  // Optimized comment addition with cache updates
  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      const { data, error } = await supabase.rpc('create_comment', {
        post_id_param: postId,
        content_param: content,
        parent_id_param: parentId || null
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onMutate: async ({ content, parentId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['optimized-comments', postId] });
      
      const previousComments = queryClient.getQueryData(['optimized-comments', postId]);
      
      // Create optimistic comment
      const optimisticComment: OptimizedComment = {
        id: `temp-${Date.now()}`,
        content,
        created_at: new Date().toISOString(),
        user_id: currentUserId!,
        parent_id: parentId || null,
        depth: parentId ? 1 : 0,
        thread_path: parentId ? [parentId, `temp-${Date.now()}`] : [`temp-${Date.now()}`],
        reply_count: 0,
        likes_count: 0,
        user_data: {
          id: currentUserId,
          username: 'You',
          full_name: 'You',
          avatar_url: null
        },
        isLiked: false,
        children: []
      };

      // Update cache optimistically
      queryClient.setQueryData(['optimized-comments', postId], (old: any) => {
        if (!old) return [optimisticComment];
        return [...old, optimisticComment];
      });

      return { previousComments };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(['optimized-comments', postId], context.previousComments);
      }
      toast.error('Failed to add comment');
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['optimized-comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Comment added successfully');
    },
  });

  // Optimized like toggle
  const toggleLikeMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { data, error } = await supabase.rpc('toggle_comment_like', {
        comment_id_param: commentId
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return { commentId, ...data };
    },
    onMutate: async (commentId) => {
      // Optimistic update for likes
      await queryClient.cancelQueries({ queryKey: ['optimized-comments', postId] });
      
      const previousComments = queryClient.getQueryData(['optimized-comments', postId]);
      
      queryClient.setQueryData(['optimized-comments', postId], (old: OptimizedComment[]) => {
        if (!old) return old;
        return old.map(comment => 
          comment.id === commentId
            ? {
                ...comment,
                isLiked: !comment.isLiked,
                likes_count: comment.isLiked ? comment.likes_count - 1 : comment.likes_count + 1
              }
            : comment
        );
      });

      return { previousComments };
    },
    onError: (err, commentId, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['optimized-comments', postId], context.previousComments);
      }
      toast.error('Failed to update like');
    },
  });

  const addComment = useCallback(
    (content: string, parentId?: string) => {
      if (!currentUserId) {
        toast.error('Please sign in to comment');
        return;
      }
      return addCommentMutation.mutateAsync({ content, parentId });
    },
    [addCommentMutation, currentUserId]
  );

  const toggleLike = useCallback(
    (commentId: string) => {
      if (!currentUserId) {
        toast.error('Please sign in to like comments');
        return;
      }
      return toggleLikeMutation.mutateAsync(commentId);
    },
    [toggleLikeMutation, currentUserId]
  );

  return {
    comments: config.useHierarchicalCache ? commentTree : comments,
    flatComments: comments,
    isLoading,
    error,
    addComment,
    toggleLike,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isAddingComment: addCommentMutation.isPending,
    isTogglingLike: toggleLikeMutation.isPending,
  };
}
