import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronUp, Heart, MoreHorizontal, Reply, Trash2 } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Add global CSS for forced visible replies
import './comments.css';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
// Removed unused imports
import CommentInput from './CommentInput';

export interface CommentType {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  parent_id?: string;
  likes_count: number;
  isLiked?: boolean;
  author: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
  };
  replies?: CommentType[];
  isNew?: boolean; // Flag to highlight newly added comments/replies
}

interface CommentItemProps {
  comment: CommentType;
  currentUserId?: string;
  onReply?: (commentId: string, authorUsername: string, content?: string) => void;
  onDelete?: (commentId: string) => void;
  isReply?: boolean; // Used for styling
  depth?: number;
  onLike?: (commentId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  onReply,
  onDelete,
  // isReply param is unused but kept for API compatibility
  depth = 0,
  onLike
}) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(comment.isLiked || false);
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  // Allow toggling replies
  const [showReplies, setShowReplies] = useState(false);

  // Ensure replies array exists and show new replies
  useEffect(() => {
    // Ensure comment.replies is always an array
    if (!comment.replies) {
      comment.replies = [];
    }

    // Show replies by default if there are new replies or if this is a newly added reply
    if (comment.replies.some(reply => reply.isNew) || comment.isNew) {
      setShowReplies(true);
    }
  }, [comment.replies, comment.isNew]);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const maxDepth = 8; // Support deeper nesting

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });
  const isAuthor = currentUserId === comment.user_id;

  const handleProfileClick = () => {
    navigate(`/profile/${comment.author.id}`);
  };

  const handleLike = async () => {
    // Optimistic update
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    setIsLikeAnimating(true);

    // Call parent handler
    onLike?.(comment.id);

    // Reset animation
    setTimeout(() => setIsLikeAnimating(false), 500);
  };

  const handleReply = () => {
    // Just show the reply input - don't call onReply yet
    setShowReplyInput(true);
    setShowReplies(true); // Always show replies when replying
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      onDelete?.(comment.id);
    }
  };

  // Calculate indentation style based on depth
  const getIndentationStyle = () => {
    // For first level replies, use a border with nuumi-pink accent
    if (depth === 1) {
      return "pl-4 border-l-2 border-nuumi-pink/20 ml-4";
    }

    // For deeper levels, use a gradient of indentation with subtle visual cues
    if (depth > 1) {
      // Use consistent indentation but vary the border color intensity
      const opacity = Math.max(10, 40 - depth * 5); // Gradually reduce opacity
      return `pl-4 ml-4 border-l border-nuumi-pink/${opacity}`;
    }

    // Root level comments
    return "border-b border-border";
  };

  return (
    <div
      id={`comment-${comment.id}`}
      className={cn(
        "py-3 transition-colors duration-200 hover:bg-muted/20 rounded-lg",
        getIndentationStyle(),
        comment.isNew && "bg-nuumi-pink/5 dark:bg-nuumi-pink/10 border-l-2 border-nuumi-pink animate-pulse"
      )}>
      <div className="flex">
        <Avatar
          src={comment.author.avatar_url || undefined}
          alt={comment.author.name}
          size="sm" // Keep consistent size
          onClick={handleProfileClick}
          className={cn(
            "cursor-pointer flex-shrink-0",
            depth > 2 && "scale-90" // Use scale for deeper nesting instead
          )}
        />

        <div className="ml-2 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <span
                className="font-medium text-sm cursor-pointer hover:underline"
                onClick={handleProfileClick}
              >
                {comment.author.name}
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                @{comment.author.username} · {timeAgo}
              </span>
            </div>

            {isAuthor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground">
                    <MoreHorizontal size={16} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <p className="text-sm mt-1 whitespace-pre-wrap break-words">{comment.content}</p>

          <div className="flex items-center mt-2 gap-4">
            <motion.button
              onClick={handleLike}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "flex items-center text-xs text-muted-foreground hover:text-nuumi-pink transition-colors",
                isLiked && "text-nuumi-pink"
              )}
              disabled={!currentUserId}
            >
              <motion.div
                animate={isLikeAnimating ? {
                  scale: [1, 1.5, 1],
                  rotate: [0, -15, 15, -15, 0],
                  transition: { duration: 0.5 }
                } : {}}
              >
                <Heart
                  size={14}
                  className={cn(
                    "mr-1 transition-all",
                    isLiked && "fill-nuumi-pink"
                  )}
                />
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.span
                  key={likesCount}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  {likesCount > 0 ? likesCount : ''}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            {depth < maxDepth && (
              <button
                onClick={handleReply}
                className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                disabled={!currentUserId}
              >
                <Reply size={14} className="mr-1" />
                Reply
              </button>
            )}
          </div>

          {/* Show reply input when replying to this comment */}
          {showReplyInput && currentUserId && (
            <div className="mt-3 mb-2">
              <CommentInput
                avatarUrl={undefined} // Will be filled by parent component
                username={currentUserId ? "You" : undefined} // Add username for current user
                onSubmit={(content: string) => {
                  if (content.trim()) {
                    // Call the parent's onReply handler with the comment content
                    onReply?.(comment.id, comment.author.username, content);

                    // Hide the reply input
                    setShowReplyInput(false);

                    // Make sure replies are visible
                    setShowReplies(true);
                  }
                }}
                placeholder={`Reply to @${comment.author.username}...`}
                autoFocus={true}
                className="pl-2 reply-input"
                onCancelReply={() => setShowReplyInput(false)}
              />
            </div>
          )}

          {/* ENHANCED REPLIES SECTION WITH DROPDOWN */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 relative">
              {/* Enhanced dropdown button */}
              <motion.button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-2 rounded-full bg-nuumi-pink/20 px-4 py-1.5 text-xs font-medium text-nuumi-pink hover:bg-nuumi-pink/30 dark:bg-nuumi-pink/30 dark:hover:bg-nuumi-pink/40 shadow-md border border-nuumi-pink/30 transition-all mb-2"
                whileHover={{ scale: 1.05, y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [10, -3, 0],
                  transition: { duration: 0.5, type: "spring", stiffness: 300 }
                }}
              >
                {showReplies ? (
                  <>
                    <ChevronUp size={16} className="text-nuumi-pink" />
                    <span>Hide {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} className="text-nuumi-pink animate-bounce" />
                    <span className="font-semibold">{`${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}</span>
                    {comment.replies?.some(reply => reply.isNew) && (
                      <span className="ml-1 text-[10px] bg-nuumi-pink text-white rounded-full px-1.5 py-0.5 animate-pulse">NEW</span>
                    )}
                  </>
                )}
              </motion.button>

              {/* Vertical line connecting to replies */}
              {showReplies && (
                <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-gradient-to-b from-nuumi-pink to-nuumi-pink/10 dark:from-nuumi-pink/70 dark:to-transparent" />
              )}

              {/* SIMPLIFIED REPLIES SECTION - NO ANIMATION */}
              {showReplies && (
                <div className="replies-container mt-2 pl-2 border-l-2 border-nuumi-pink/10 dark:border-nuumi-pink/20 rounded-bl-lg">
                  {comment.replies.length > 0 ? (
                    comment.replies.map(reply => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        currentUserId={currentUserId}
                        onReply={onReply}
                        onDelete={onDelete}
                        isReply={true}
                        depth={depth + 1}
                        onLike={onLike}
                      />
                    ))
                  ) : (
                    <div className="py-2 text-sm text-muted-foreground">
                      No replies yet. Be the first to reply!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
