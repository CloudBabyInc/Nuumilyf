import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CacheConfig {
  prefetchReplies: boolean;
  maxCacheSize: number;
  staleTime: number;
}

interface OptimizedComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  depth: number;
  reply_count: number;
  likes_count: number;
  user_data: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  isLiked: boolean;
}

export function useIntelligentCommentCache(
  postId: string,
  currentUserId?: string,
  config: Partial<CacheConfig> = {}
) {
  const queryClient = useQueryClient();

  const cacheConfig = useMemo(() => ({
    prefetchReplies: true,
    maxCacheSize: 100,
    staleTime: 60000, // 1 minute
    ...config
  }), [config]);

  // Main optimized comments query
  const { data: comments = [], isLoading, error } = useQuery({
    queryKey: ['optimized-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_optimized_comments', {
        post_id_param: postId,
        limit_param: cacheConfig.maxCacheSize
      });

      if (error) throw error;

      // Get user likes in batch
      let userLikes: string[] = [];
      if (currentUserId && data.length > 0) {
        const commentIds = data.map(c => c.id);
        const { data: likesData } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .in('comment_id', commentIds)
          .eq('user_id', currentUserId);

        userLikes = likesData?.map(l => l.comment_id) || [];
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
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.staleTime * 5,
  });

  // Build hierarchical tree structure
  const commentTree = useMemo(() => {
    const commentMap = new Map<string, OptimizedComment & { children: OptimizedComment[] }>();
    const rootComments: (OptimizedComment & { children: OptimizedComment[] })[] = [];

    // Create enhanced comments with children array
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, children: [] });
    });

    // Build tree structure
    comments.forEach(comment => {
      const commentNode = commentMap.get(comment.id)!;

      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.children.push(commentNode);
        } else {
          // If parent not found, treat as root comment
          rootComments.push(commentNode);
        }
      } else {
        rootComments.push(commentNode);
      }
    });

    // Sort children by creation date
    const sortChildren = (comment: OptimizedComment & { children: OptimizedComment[] }) => {
      comment.children.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      comment.children.forEach(sortChildren);
    };

    rootComments.forEach(sortChildren);
    return rootComments;
  }, [comments]);

  // Prefetch related data
  const prefetchReplies = useCallback(async (commentId: string) => {
    if (!cacheConfig.prefetchReplies) return;

    const cacheKey = ['comment-replies', commentId];
    const cached = queryClient.getQueryData(cacheKey);

    if (!cached) {
      queryClient.prefetchQuery({
        queryKey: cacheKey,
        queryFn: async () => {
          const { data } = await supabase
            .from('comments')
            .select('*')
            .eq('parent_id', commentId)
            .order('created_at', { ascending: true });
          return data || [];
        },
        staleTime: cacheConfig.staleTime,
      });
    }
  }, [queryClient, cacheConfig]);

  // Memory management
  const cleanupCache = useCallback(() => {
    const queries = queryClient.getQueryCache().getAll();
    const commentQueries = queries.filter(q =>
      q.queryKey[0] === 'optimized-comments' ||
      q.queryKey[0] === 'comment-replies'
    );

    if (commentQueries.length > cacheConfig.maxCacheSize) {
      // Remove oldest queries
      commentQueries
        .sort((a, b) => (a.state.dataUpdatedAt || 0) - (b.state.dataUpdatedAt || 0))
        .slice(0, commentQueries.length - cacheConfig.maxCacheSize)
        .forEach(query => {
          queryClient.removeQueries({ queryKey: query.queryKey });
        });
    }
  }, [queryClient, cacheConfig.maxCacheSize]);

  return {
    comments,
    commentTree,
    isLoading,
    error,
    prefetchReplies,
    cleanupCache,
    cacheStats: {
      totalComments: comments.length,
      rootComments: commentTree.length,
      cacheSize: queryClient.getQueryCache().getAll().length
    }
  };
}