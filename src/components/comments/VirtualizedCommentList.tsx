import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import CommentItem from './CommentItem';

interface VirtualizedCommentListProps {
  postId: string;
  currentUserId?: string;
  height: number;
  onReply: (commentId: string, username: string, content?: string) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
}

interface FlatComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  depth: number;
  thread_path: string[];
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

const VirtualizedCommentList: React.FC<VirtualizedCommentListProps> = ({
  postId,
  currentUserId,
  height,
  onReply,
  onDelete,
  onLike
}) => {
  // Fetch flattened comments with threading info
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['threaded-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_threaded_comments', {
        post_id_param: postId,
        limit_param: 100,
        offset_param: 0,
        max_depth: 3
      });

      if (error) throw error;

      // Get user likes if authenticated
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
      })) as FlatComment[];
    },
    enabled: !!postId,
    staleTime: 30000,
  });

  // Memoized item renderer for performance
  const ItemRenderer = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const comment = comments[index];
    if (!comment) return null;

    return (
      <div style={style}>
        <CommentItem
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
            likes_count: comment.likes_count,
            isLiked: comment.isLiked,
            replies: [] // Flattened structure doesn't need nested replies
          }}
          currentUserId={currentUserId}
          onReply={onReply}
          onDelete={onDelete}
          onLike={onLike}
          isReply={comment.depth > 0}
          depth={comment.depth}
        />
      </div>
    );
  }, [comments, postId, currentUserId, onReply, onDelete, onLike]);

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
    <List
      height={height}
      width="100%"
      itemCount={comments.length}
      itemSize={120} // Estimated height per comment
      itemData={comments}
    >
      {ItemRenderer}
    </List>
  );
};

export default VirtualizedCommentList;
