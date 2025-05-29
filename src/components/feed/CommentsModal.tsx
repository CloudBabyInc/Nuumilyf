import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Heart, Reply } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Avatar from '@/components/shared/Avatar';
import { usePostInteractions, useCommentInteractions } from '@/hooks/usePostInteractions';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  parent_id: string | null;
  likes_count: number;
  isLiked: boolean;
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  replies?: Comment[];
}

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  currentUserId?: string;
}

const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  postId,
  currentUserId
}) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { addComment, loadingStates } = usePostInteractions();
  const { toggleCommentLike, loadingStates: commentLoadingStates } = useCommentInteractions();

  // Fetch comments for the post
  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          post_id,
          parent_id,
          user:profiles!comments_user_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get likes count and user likes for each comment
      const commentIds = data.map(c => c.id);
      
      if (commentIds.length === 0) return [];

      // Get likes count for all comments
      const { data: likesData } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .in('comment_id', commentIds);

      // Get user's likes if authenticated
      let userLikes: any[] = [];
      if (currentUserId) {
        const { data: userLikesData } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .in('comment_id', commentIds)
          .eq('user_id', currentUserId);
        userLikes = userLikesData || [];
      }

      const likesCountMap = likesData?.reduce((acc, like) => {
        acc[like.comment_id] = (acc[like.comment_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const userLikesSet = new Set(userLikes.map(like => like.comment_id));

      // Transform comments with likes data
      const transformedComments = data.map(comment => ({
        ...comment,
        likes_count: likesCountMap[comment.id] || 0,
        isLiked: userLikesSet.has(comment.id)
      }));

      // Organize comments into threads (parent comments with replies)
      const parentComments = transformedComments.filter(c => !c.parent_id);
      const replies = transformedComments.filter(c => c.parent_id);

      return parentComments.map(parent => ({
        ...parent,
        replies: replies.filter(reply => reply.parent_id === parent.id)
      }));
    },
    enabled: isOpen && !!postId,
    staleTime: 30000,
  });

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUserId) return;

    try {
      await addComment(postId, newComment.trim(), replyingTo || undefined);
      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!currentUserId) return;
    await toggleCommentLike(commentId);
  };

  const CommentItem: React.FC<{ comment: Comment; isReply?: boolean }> = ({ comment, isReply = false }) => (
    <div className={cn("flex space-x-3", isReply && "ml-12 mt-2")}>
      <Avatar
        src={comment.user.avatar_url}
        alt={comment.user.full_name || comment.user.username}
        size="sm"
      />
      <div className="flex-1">
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-sm">
              {comment.user.full_name || comment.user.username}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm">{comment.content}</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-2">
          <button
            onClick={() => handleCommentLike(comment.id)}
            disabled={commentLoadingStates[`comment-like-${comment.id}`]}
            className={cn(
              "flex items-center space-x-1 text-xs transition-colors",
              comment.isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
            )}
          >
            <Heart size={12} className={comment.isLiked ? "fill-current" : ""} />
            <span>{comment.likes_count}</span>
          </button>
          
          {!isReply && (
            <button
              onClick={() => setReplyingTo(comment.id)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Reply
            </button>
          )}
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-2">
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-background rounded-t-xl z-50 max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Comments</h3>
              <button
                onClick={onClose}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex space-x-3">
                      <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                      <div className="flex-1">
                        <div className="bg-muted rounded-lg p-3 animate-pulse">
                          <div className="h-4 bg-muted-foreground/20 rounded mb-2" />
                          <div className="h-3 bg-muted-foreground/20 rounded w-3/4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments && comments.length > 0 ? (
                comments.map(comment => (
                  <CommentItem key={comment.id} comment={comment} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>

            {/* Comment Input */}
            {currentUserId && (
              <div className="p-4 border-t">
                {replyingTo && (
                  <div className="flex items-center justify-between mb-2 p-2 bg-muted rounded">
                    <span className="text-sm text-muted-foreground">
                      Replying to comment
                    </span>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                    className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || loadingStates[`comment-${postId}`]}
                    size="sm"
                    className="self-end"
                  >
                    {loadingStates[`comment-${postId}`] ? (
                      <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommentsModal;
