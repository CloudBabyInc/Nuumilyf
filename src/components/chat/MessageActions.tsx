import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit3,
  Trash2,
  Copy,
  Reply,
  Clock,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MessageActionsProps {
  messageId: string;
  content: string;
  senderId: string;
  currentUserId: string;
  createdAt: string;
  isDeleted?: boolean;
  isEdited?: boolean;
  onEdit?: (messageId: string, newContent: string) => void;
  onUnsend?: (messageId: string) => void;
  onReply?: (content: string) => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  messageId,
  content,
  senderId,
  currentUserId,
  createdAt,
  isDeleted = false,
  isEdited = false,
  onEdit,
  onUnsend,
  onReply
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canModify, setCanModify] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const isOwnMessage = senderId === currentUserId;
  const messageTime = new Date(createdAt);
  const threeMinutesLater = new Date(messageTime.getTime() + 3 * 60 * 1000);

  // Calculate time left for editing/unsending
  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date();
      const remaining = Math.max(0, threeMinutesLater.getTime() - now.getTime());
      setTimeLeft(remaining);
      setCanModify(remaining > 0 && isOwnMessage && !isDeleted);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [createdAt, isOwnMessage, isDeleted]);

  const formatTimeLeft = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Long press handlers
  const handleLongPressStart = () => {
    setIsLongPressing(true);
    longPressTimer.current = setTimeout(() => {
      setIsOpen(true);
      setIsLongPressing(false);
    }, 500); // 500ms long press
  };

  const handleLongPressEnd = () => {
    setIsLongPressing(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Message copied to clipboard');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to copy message');
    }
  };

  const handleReply = () => {
    onReply?.(content);
    setIsOpen(false);
  };

  const handleEdit = async () => {
    if (!canModify) {
      toast.error('Cannot edit this message');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('edit_message', {
        message_id: messageId,
        user_id: currentUserId,
        new_content: editContent.trim()
      });

      if (error) throw error;

      if (data.success) {
        onEdit?.(messageId, editContent.trim());
        toast.success('Message edited successfully');
        setIsEditing(false);
        setIsOpen(false);
      } else {
        toast.error(data.error || 'Failed to edit message');
      }
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error('Failed to edit message');
    }
  };

  const handleUnsend = async () => {
    if (!canModify) {
      toast.error('Cannot unsend this message');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('unsend_message', {
        message_id: messageId,
        user_id: currentUserId
      });

      if (error) throw error;

      if (data.success) {
        onUnsend?.(messageId);
        toast.success('Message unsent');
        setIsOpen(false);
      } else {
        toast.error(data.error || 'Failed to unsend message');
      }
    } catch (error) {
      console.error('Error unsending message:', error);
      toast.error('Failed to unsend message');
    }
  };

  if (isDeleted) {
    return null;
  }

  return (
    <div className="relative">
      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsEditing(false)}
          >
            <motion.div
              className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Edit Message</h3>

              {canModify && (
                <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                  <Clock size={14} />
                  <span>Time left: {formatTimeLeft(timeLeft)}</span>
                </div>
              )}

              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-nuumi-pink"
                rows={3}
                maxLength={1000}
                disabled={!canModify}
              />

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={!canModify || editContent.trim() === content}
                  className="px-4 py-2 text-sm bg-nuumi-pink text-white rounded-lg hover:bg-nuumi-pink/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/20 z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-card/95 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl py-2 min-w-[200px] z-40"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
            {/* Time indicator for own messages */}
            {isOwnMessage && !isDeleted && (
              <div className="px-3 py-2 border-b border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock size={12} />
                  {canModify ? (
                    <span>Can modify for {formatTimeLeft(timeLeft)}</span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <AlertCircle size={12} />
                      Modification time expired
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Copy */}
            <button
              onClick={handleCopy}
              className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2"
            >
              <Copy size={14} />
              Copy Message
            </button>

            {/* Reply */}
            <button
              onClick={handleReply}
              className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2"
            >
              <Reply size={14} />
              Reply
            </button>

            {/* Edit (only for own messages within time limit) */}
            {isOwnMessage && canModify && (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2"
              >
                <Edit3 size={14} />
                Edit Message
              </button>
            )}

            {/* Unsend (only for own messages within time limit) */}
            {isOwnMessage && canModify && (
              <button
                onClick={handleUnsend}
                className="w-full px-3 py-2 text-left text-sm hover:bg-secondary text-red-600 flex items-center gap-2"
              >
                <Trash2 size={14} />
                Unsend Message
              </button>
            )}

            {/* Edit history indicator */}
            {isEdited && (
              <div className="px-3 py-2 border-t border-border">
                <span className="text-xs text-muted-foreground">This message was edited</span>
              </div>
            )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Invisible Long Press Area - covers the entire message bubble */}
      <div
        className="absolute inset-0 z-10"
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onTouchCancel={handleLongPressEnd}
        style={{
          background: isLongPressing ? 'rgba(0,0,0,0.1)' : 'transparent',
          borderRadius: 'inherit'
        }}
      />

      {/* Long press feedback */}
      {isLongPressing && (
        <motion.div
          className="absolute inset-0 bg-black/10 rounded-2xl"
          initial={{ scale: 1 }}
          animate={{ scale: 1.05 }}
          transition={{ duration: 0.5 }}
        />
      )}
    </div>
  );
};

export default MessageActions;
