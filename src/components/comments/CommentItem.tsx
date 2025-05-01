import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronUp, Heart, MoreHorizontal, Reply, Trash2 } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
}

interface CommentItemProps {
  comment: CommentType;
  currentUserId?: string;
  onReply?: (commentId: string, authorUsername: string) => void;
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
  isReply = false,
  depth = 0,
  onLike
}) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(comment.isLiked || false);
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showReplies, setShowReplies] = useState(depth < 2); // Auto-expand first two levels
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
    setShowReplyInput(true);
    setShowReplies(true); // Always show replies when replying
    onReply?.(comment.id, comment.author.username);
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
    <div className={cn(
      "py-3 transition-colors duration-200 hover:bg-muted/20 rounded-lg",
      getIndentationStyle()
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
                onSubmit={(_: string) => {
                  // We don't use the content here, just trigger the reply in parent
                  onReply?.(comment.id, comment.author.username);
                  // The actual submission is handled by the parent component
                  setShowReplyInput(false);
                }}
                placeholder={`Reply to @${comment.author.username}...`}
                autoFocus={true}
                className="pl-2"
                onCancelReply={() => setShowReplyInput(false)}
              />
            </div>
          )}

          {/* Show replies if any */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 relative">
              {/* Stylish dropdown button */}
              <motion.button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-2 rounded-full bg-nuumi-pink/10 px-3 py-1 text-xs font-medium text-nuumi-pink hover:bg-nuumi-pink/20 transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {showReplies ? (
                  <>
                    <ChevronUp size={14} />
                    <span>Hide replies</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} />
                    <span>{`${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}</span>
                  </>
                )}
              </motion.button>

              {/* Vertical line connecting to replies */}
              {showReplies && (
                <div className="absolute left-4 top-7 bottom-0 w-0.5 bg-gradient-to-b from-nuumi-pink/30 to-transparent" />
              )}

              <AnimatePresence>
                {showReplies && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="mt-2"
                  >
                    {comment.replies.map(reply => (
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
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
