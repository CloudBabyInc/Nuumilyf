import React, { memo, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useIntelligentCommentCache } from '@/hooks/useIntelligentCommentCache';
import CommentItem from './CommentItem';

interface MemoryOptimizedCommentListProps {
  postId: string;
  currentUserId?: string;
  height: number;
  onReply: (commentId: string, username: string, content?: string) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
}

// Memoized comment item to prevent unnecessary re-renders
const MemoizedCommentItem = memo(CommentItem);

const MemoryOptimizedCommentList: React.FC<MemoryOptimizedCommentListProps> = ({
  postId,
  currentUserId,
  height,
  onReply,
  onDelete,
  onLike
}) => {
  const {
    commentTree,
    isLoading,
    prefetchReplies,
    cleanupCache,
    cacheStats
  } = useIntelligentCommentCache(postId, currentUserId, {
    prefetchReplies: true,
    maxCacheSize: 50, // Limit for mobile
    staleTime: 30000
  });

  // Flatten comments for virtual scrolling
  const flatComments = useMemo(() => {
    const flattened: any[] = [];

    const addComment = (comment: any, depth = 0) => {
      flattened.push({ ...comment, depth });

      // Add replies recursively (up to 5 levels for deeper nesting)
      if (comment.children && comment.children.length > 0 && depth < 5) {
        comment.children.forEach((child: any) => {
          addComment(child, depth + 1);
        });
      }
    };

    commentTree.forEach(comment => addComment(comment));



    return flattened;
  }, [commentTree]);

  // Optimized item renderer with memory management
  const ItemRenderer = useCallback(({
    index,
    style
  }: {
    index: number;
    style: React.CSSProperties
  }) => {
    const comment = flatComments[index];
    if (!comment) return null;

    // Prefetch replies when comment comes into view
    if (comment.reply_count > 0 && comment.depth < 2) {
      prefetchReplies(comment.id);
    }

    return (
      <div style={style}>
        <MemoizedCommentItem
          comment={{
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            user_id: comment.user_id,
            post_id: postId,
            parent_id: comment.parent_id,
            author: {
              id: comment.user_data.id,
              name: comment.user_data.full_name || comment.user_data.username,
              username: comment.user_data.username,
              avatar_url: comment.user_data.avatar_url
            },
            likes_count: comment.likes_count || 0,
            isLiked: comment.isLiked,
            replies: [] // Flattened structure
          }}
          currentUserId={currentUserId}
          onReply={onReply}
          onDelete={onDelete}
          onLike={onLike}
          isReply={comment.depth > 0}
          depth={comment.depth}
          maxDepth={5}
        />
      </div>
    );
  }, [flatComments, postId, currentUserId, onReply, onDelete, onLike, prefetchReplies]);

  // Cleanup cache when component unmounts or when cache gets too large
  React.useEffect(() => {
    return () => {
      if (cacheStats.cacheSize > 100) {
        cleanupCache();
      }
    };
  }, [cleanupCache, cacheStats.cacheSize]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-muted rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Cache stats for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground p-2 bg-muted/20">
          Comments: {cacheStats.totalComments} | Cache: {cacheStats.cacheSize}
        </div>
      )}

      <List
        height={height}
        width="100%"
        itemCount={flatComments.length}
        itemSize={100} // Smaller for mobile
        itemData={flatComments}
        overscanCount={5} // Render 5 extra items for smooth scrolling
      >
        {ItemRenderer}
      </List>
    </div>
  );
};

export default memo(MemoryOptimizedCommentList);
