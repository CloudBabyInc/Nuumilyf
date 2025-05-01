import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CommentItem, { CommentType } from './CommentItem';
import CommentInput from './CommentInput';
import { Loader2, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

interface CommentListProps {
  postId: string;
  currentUser?: {
    id: string;
    avatarUrl?: string;
  };
  className?: string;
}

const CommentList: React.FC<CommentListProps> = ({
  postId,
  currentUser,
  className
}) => {
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string } | null>(null);

  // Fetch comments
  const { data: comments, isLoading, error } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      // Fetch all comments for this post
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

      // Fetch user details for each comment
      const commentsWithAuthors = await Promise.all(data.map(async (comment) => {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url')
          .eq('id', comment.user_id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          return null;
        }

        // Get likes count
        const { count: likesCount, error: likesError } = await supabase
          .from('comment_likes')
          .select('id', { count: 'exact', head: true })
          .eq('comment_id', comment.id);

        if (likesError) {
          console.error('Error fetching likes count:', likesError);
        }

        // Check if current user liked this comment
        let isLiked = false;
        if (currentUser?.id) {
          const { data: likeData, error: likeError } = await supabase
            .from('comment_likes')
            .select('id')
            .eq('comment_id', comment.id)
            .eq('user_id', currentUser.id)
            .maybeSingle();

          if (likeError) {
            console.error('Error checking like status:', likeError);
          }

          isLiked = !!likeData;
        }

        return {
          ...comment,
          author: {
            id: userData.id,
            name: userData.display_name || userData.username,
            username: userData.username,
            avatar_url: userData.avatar_url
          },
          likes_count: likesCount || 0,
          isLiked,
          replies: [] // Will be filled later
        };
      }));

      const validComments = commentsWithAuthors.filter(Boolean) as CommentType[];

      // Organize comments into a tree structure
      const commentMap = new Map<string, CommentType>();
      const rootComments: CommentType[] = [];

      // First, create a map of all comments by ID
      validComments.forEach(comment => {
        commentMap.set(comment.id, comment);
      });

      // Then, organize them into a tree
      validComments.forEach(comment => {
        if (comment.parent_id) {
          // This is a reply, add it to its parent's replies array
          const parentComment = commentMap.get(comment.parent_id);
          if (parentComment) {
            parentComment.replies = parentComment.replies || [];
            parentComment.replies.push(comment);
          } else {
            // If parent doesn't exist (shouldn't happen), treat as root
            rootComments.push(comment);
          }
        } else {
          // This is a root comment
          rootComments.push(comment);
        }
      });

      // Sort root comments by newest first
      return rootComments.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!postId
  });

  // Handle adding a new comment
  const handleAddComment = async (content: string) => {
    if (!currentUser) {
      toast.error('You must be logged in to comment');
      return;
    }

    try {
      // If replying to a comment, handle differently
      if (replyingTo) {
        const { data, error } = await supabase
          .from('comments')
          .insert({
            content,
            post_id: postId,
            user_id: currentUser.id,
            parent_id: replyingTo.commentId // Set the parent_id for nested replies
          })
          .select();

        if (error) throw error;

        toast.success('Reply added');
        setReplyingTo(null);
      } else {
        // Regular comment (top-level)
        const { data, error } = await supabase
          .from('comments')
          .insert({
            content,
            post_id: postId,
            user_id: currentUser.id,
            parent_id: null // Explicitly set to null for top-level comments
          })
          .select();

        if (error) throw error;

        toast.success('Comment added');
      }

      // Invalidate query to refresh comments
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });

      // Update post comments count
      queryClient.invalidateQueries({ queryKey: ['posts'] });

    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast.success('Comment deleted');

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });

    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  // Handle liking a comment
  const handleLikeComment = async (commentId: string) => {
    if (!currentUser) {
      toast.error('You must be logged in to like comments');
      return;
    }

    try {
      // Check if already liked
      const { data: existingLike, error: checkError } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: currentUser.id
          });

        if (error) throw error;
      }

      // No need to invalidate query as we're using optimistic updates in the UI

    } catch (error) {
      console.error('Error toggling comment like:', error);
      toast.error('Failed to update like');

      // If there was an error, refresh to get the correct state
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    }
  };

  // Handle reply
  const handleReply = (commentId: string, username: string) => {
    setReplyingTo({ commentId, username });
  };

  if (error) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        <p>Failed to load comments. Please try again.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Comment input */}
      <CommentInput
        avatarUrl={currentUser?.avatarUrl}
        onSubmit={handleAddComment}
        placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
        replyingTo={replyingTo?.username}
        onCancelReply={() => setReplyingTo(null)}
        className="mb-4"
      />

      {/* Comments list */}
      <div className="mt-2">
        <h3 className="text-base font-medium mb-4 flex items-center text-muted-foreground">
          <MessageSquare size={16} className="mr-2" />
          {comments?.length
            ? `${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`
            : 'No comments yet'
          }
        </h3>

        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="py-3 border-b border-border">
              <div className="flex">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="ml-3 flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            </div>
          ))
        ) : comments?.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <AnimatePresence>
            {comments?.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <CommentItem
                  comment={comment}
                  currentUserId={currentUser?.id}
                  onReply={handleReply}
                  onDelete={handleDeleteComment}
                  onLike={handleLikeComment}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default CommentList;
