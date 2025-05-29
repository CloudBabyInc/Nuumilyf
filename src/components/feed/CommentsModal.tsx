import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Heart, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
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
          parent_id
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get user profiles for all comments
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      // Create a map of user profiles
      const profileMap = profiles?.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      // Add user data to comments
      const commentsWithUsers = data.map(comment => ({
        ...comment,
        user: profileMap[comment.user_id] || {
          id: comment.user_id,
          username: 'Unknown User',
          full_name: null,
          avatar_url: null
        }
      }));



      // Get likes count and user likes for each comment
      const commentIds = commentsWithUsers.map(c => c.id);

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

      // Transform comments with likes data and return flat array
      const transformedComments = commentsWithUsers.map(comment => ({
        ...comment,
        likes_count: likesCountMap[comment.id] || 0,
        isLiked: userLikesSet.has(comment.id)
      }));

      // Debug: Log the flat comments array
      console.log('📝 All comments (flat):', transformedComments);
      console.log('📊 Root comments:', transformedComments.filter(c => !c.parent_id));
      console.log('💬 Reply comments:', transformedComments.filter(c => c.parent_id));

      // Return flat array - CollapsibleComment will handle nesting
      return transformedComments;
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

  // New Collapsible Comment Component
  const CollapsibleComment: React.FC<{
    comment: Comment;
    depth?: number;
    allComments: Comment[];
  }> = ({ comment, depth = 0, allComments }) => {
    const [isExpanded, setIsExpanded] = useState(depth < 2); // Auto-expand first 2 levels

    // Get replies for this comment
    const replies = allComments.filter(c => c.parent_id === comment.id);
    const hasReplies = replies.length > 0;

    // Debug logging
    if (replies.length > 0) {
      console.log(`🔗 Comment ${comment.id.slice(0,8)} has ${replies.length} replies:`, replies.map(r => r.id.slice(0,8)));
    }

    // User data with fallback
    const user = comment.user || {
      id: comment.user_id,
      username: 'Unknown User',
      full_name: null,
      avatar_url: null
    };

    return (
      <div className={cn("border-l-2 border-transparent", depth > 0 && "border-l-gray-200 ml-4 pl-4")}>
        {/* Comment Content */}
        <div className="flex space-x-3 py-3">
          <Avatar
            src={user.avatar_url}
            alt={user.full_name || user.username}
            size="sm"
          />
          <div className="flex-1">
            {/* Comment Bubble */}
            <div className="bg-gray-50 rounded-2xl px-4 py-3">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-semibold text-sm text-gray-900">
                  {user.full_name || user.username}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-gray-800">{comment.content}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4 mt-2 ml-4">
              {/* Like Button */}
              <button
                onClick={() => handleCommentLike(comment.id)}
                disabled={commentLoadingStates[`comment-like-${comment.id}`]}
                className={cn(
                  "flex items-center space-x-1 text-xs font-medium transition-colors",
                  comment.isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                )}
              >
                <Heart size={14} className={comment.isLiked ? "fill-current" : ""} />
                <span>{comment.likes_count || 0}</span>
              </button>

              {/* Reply Button */}
              <button
                onClick={() => setReplyingTo(comment.id)}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Reply
              </button>

              {/* Replies Toggle */}
              {hasReplies && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center space-x-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                  <span>
                    {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Nested Replies */}
        <AnimatePresence>
          {hasReplies && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              {replies.map(reply => (
                <CollapsibleComment
                  key={reply.id}
                  comment={reply}
                  depth={depth + 1}
                  allComments={allComments}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[9999]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 right-0 bg-white rounded-t-xl flex flex-col"
            style={{
              bottom: '80px', // ABOVE the tab bar (tab bar is ~80px high)
              height: 'calc(100vh - 160px)', // Leave space for tab bar + status bar
              zIndex: 99999
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg text-gray-900">Comments</h3>
                {comments && (
                  <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
                    {comments.length}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Comments List - New Design */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-2xl p-3 animate-pulse">
                          <div className="h-4 bg-gray-200 rounded mb-2" />
                          <div className="h-3 bg-gray-200 rounded w-3/4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments && comments.length > 0 ? (
                <div className="px-4">
                  {/* Show only root comments - replies are handled recursively */}
                  {comments
                    .filter(comment => !comment.parent_id) // Only root comments
                    .map(comment => (
                      <CollapsibleComment
                        key={comment.id}
                        comment={comment}
                        depth={0}
                        allComments={comments}
                      />
                    ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No comments yet</p>
                  <p className="text-sm">Be the first to share your thoughts!</p>
                </div>
              )}
            </div>

            {/* Comment Input - ABOVE TAB BAR */}
            {currentUserId && (
              <div className="p-4 border-t-2 border-gray-100 bg-white shadow-2xl relative">
                {/* Visual indicator that this is above tab bar */}
                <div className="absolute -bottom-1 left-0 right-0 h-2 bg-gradient-to-b from-white to-transparent"></div>
                {replyingTo && (
                  <div className="flex items-center justify-between mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-sm text-blue-700 font-medium">
                      💬 Replying to comment
                    </span>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                    className="flex-1 min-h-[44px] max-h-[120px] resize-none border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-0"
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
                    size="lg"
                    className="self-end bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl"
                  >
                    {loadingStates[`comment-${postId}`] ? (
                      <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send size={18} />
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
