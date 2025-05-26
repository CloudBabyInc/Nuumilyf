
import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Repeat2, Send, MoreHorizontal, Trash2, EyeOff, Edit3, Flag, Copy, Share } from 'lucide-react';
import Avatar from './Avatar';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CommentModal from '@/components/comments/CommentModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface PostProps {
  id: string; // Post ID
  author: {
    name: string;
    username: string;
    avatar?: string;
    isVerified?: boolean;
    timeAgo: string;
    id: string; // Author ID
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  reposts: number;
  isLiked?: boolean;
  currentUser?: {
    id: string;
    avatarUrl?: string;
    username?: string; // Add username property
    displayName?: string; // Add displayName property
  };
  onLike?: () => void;
  onComment?: () => void;
  onRepost?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  onHide?: () => void;
  onEdit?: () => void;
  onReport?: () => void;
}

const Post = ({
  id,
  author,
  content,
  image,
  likes,
  comments,
  reposts,
  isLiked = false,
  currentUser,
  onLike,
  onComment,
  onRepost,
  onShare,
  onDelete,
  onHide,
  onEdit,
  onReport
}: PostProps) => {
  const navigate = useNavigate();

  // Local state for optimistic updates
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [localLikes, setLocalLikes] = useState(likes);
  const [localComments, setLocalComments] = useState(comments);
  const [localReposts, setLocalReposts] = useState(reposts);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [isCommentAnimating, setIsCommentAnimating] = useState(false);
  const [isRepostAnimating, setIsRepostAnimating] = useState(false);
  const [isShareAnimating, setIsShareAnimating] = useState(false);

  // Comment modal state
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  // Post menu state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // Debug log for currentUser
  useEffect(() => {
    console.log('Post component - currentUser:', currentUser, 'for post:', id);
  }, [currentUser, id]);

  // Handle like with optimistic update
  const handleLike = () => {
    setLocalLiked(!localLiked);
    setLocalLikes(localLiked ? localLikes - 1 : localLikes + 1);
    setIsLikeAnimating(true);

    // Call the parent handler
    onLike?.();

    // Reset animation state after animation completes
    setTimeout(() => setIsLikeAnimating(false), 500);
  };

  // Handle repost with optimistic update
  const handleRepost = () => {
    setLocalReposts(localReposts + 1);
    setIsRepostAnimating(true);

    // Call the parent handler
    onRepost?.();

    // Reset animation state after animation completes
    setTimeout(() => setIsRepostAnimating(false), 500);
  };

  // Handle share with animation
  const handleShare = () => {
    setIsShareAnimating(true);

    // Call the parent handler
    onShare?.();

    // Reset animation state after animation completes
    setTimeout(() => setIsShareAnimating(false), 500);
  };

  const handleProfileClick = () => {
    navigate(`/profile/${author.id}`);
  };

  // Post menu handlers
  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete?.();
    setShowDeleteDialog(false);
    toast.success('Post deleted successfully');
  };

  const handleHide = () => {
    setIsHidden(true);
    onHide?.();
    toast.success('Post hidden from your feed');
  };

  const handleEdit = () => {
    onEdit?.();
    toast.info('Edit functionality coming soon');
  };

  const handleReport = () => {
    onReport?.();
    toast.success('Post reported. Thank you for helping keep our community safe.');
  };

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/post/${id}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      toast.success('Post link copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  // Check if current user is the post author
  const isOwnPost = currentUser?.id === author.id;

  // Don't render if hidden
  if (isHidden) {
    return null;
  }

  return (
    <div className="bg-card rounded-xl p-4 mb-3 animate-fade-in">
      <div className="flex items-start mb-3">
        <Avatar
          src={author.avatar}
          alt={author.name}
          size="md"
          onClick={handleProfileClick}
          className="cursor-pointer"
        />
        <div className="ml-3 flex flex-col flex-1">
          <div className="flex items-center">
            <h4
              className="font-semibold text-foreground cursor-pointer hover:underline"
              onClick={handleProfileClick}
            >
              {author.name}
            </h4>
            {author.isVerified && (
              <span className="ml-1 text-nuumi-pink">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
            <span className="text-sm text-muted-foreground ml-2">· {author.timeAgo}</span>
          </div>
          <span
            className="text-sm text-muted-foreground cursor-pointer hover:underline"
            onClick={handleProfileClick}
          >
            @{author.username}
          </span>
        </div>

        {/* Post Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              className="p-2 rounded-full hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal size={18} />
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 glass-dialog animate-scale-in"
            sideOffset={5}
          >
            {isOwnPost ? (
              <>
                <DropdownMenuItem
                  onClick={handleEdit}
                  className="cursor-pointer hover:bg-secondary/50 transition-colors"
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit post
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete post
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            ) : (
              <>
                <DropdownMenuItem
                  onClick={handleHide}
                  className="cursor-pointer hover:bg-secondary/50 transition-colors"
                >
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide post
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleReport}
                  className="cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                >
                  <Flag className="mr-2 h-4 w-4" />
                  Report post
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={handleCopyLink}
              className="cursor-pointer hover:bg-secondary/50 transition-colors"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleShare}
              className="cursor-pointer hover:bg-secondary/50 transition-colors"
            >
              <Share className="mr-2 h-4 w-4" />
              Share post
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-foreground mb-3 text-balance">{content}</p>

      {image && (
        <div className="rounded-xl overflow-hidden mb-3 bg-secondary/30 relative">
          <img
            src={image}
            alt="Post content"
            className="w-full object-cover max-h-96 transition-opacity duration-300"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <motion.button
          onClick={handleLike}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "flex items-center text-sm text-muted-foreground hover:text-nuumi-pink transition-colors",
            localLiked && "text-nuumi-pink"
          )}
        >
          <motion.div
            animate={isLikeAnimating ? {
              scale: [1, 1.5, 1],
              rotate: [0, -15, 15, -15, 0],
              transition: { duration: 0.5 }
            } : {}}
          >
            <Heart
              size={18}
              className={cn(
                "mr-1 transition-all",
                localLiked && "fill-nuumi-pink"
              )}
            />
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.span
              key={localLikes}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              {localLikes}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <motion.button
          onClick={() => {
            setIsCommentModalOpen(true);
            setIsCommentAnimating(true);
            onComment?.();
            setTimeout(() => setIsCommentAnimating(false), 500);
          }}
          whileTap={{ scale: 0.9 }}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <motion.div
            animate={isCommentAnimating ? {
              y: [0, -5, 0],
              transition: { duration: 0.5 }
            } : {}}
          >
            <MessageSquare size={18} className="mr-1" />
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.span
              key={localComments}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.2 }}
            >
              {localComments}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <motion.button
          onClick={handleRepost}
          whileTap={{ scale: 0.9 }}
          className="flex items-center text-sm text-muted-foreground hover:text-green-500 transition-colors"
        >
          <motion.div
            animate={isRepostAnimating ? {
              rotate: [0, 0, 360],
              transition: { duration: 0.5 }
            } : {}}
          >
            <Repeat2 size={18} className="mr-1" />
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.span
              key={localReposts}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              {localReposts}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <motion.button
          onClick={handleShare}
          whileTap={{ scale: 0.9 }}
          className="flex items-center text-sm text-muted-foreground hover:text-blue-500 transition-colors"
        >
          <motion.div
            animate={isShareAnimating ? {
              x: [0, 10, 0],
              transition: { duration: 0.3 }
            } : {}}
          >
            <Send size={18} />
          </motion.div>
        </motion.button>
      </div>

      {/* Comment Modal */}
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        postId={id}
        postTitle={content.length > 30 ? `${content.substring(0, 30)}...` : content}
        currentUser={currentUser}
        postAuthor={{
          id: author.id,
          username: author.username
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="glass-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Post;
