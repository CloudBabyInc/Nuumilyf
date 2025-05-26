import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MoreHorizontal, 
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
          <motion.div
            className="absolute bottom-full right-0 mb-2 bg-card border border-border rounded-lg shadow-lg py-2 min-w-[180px] z-40"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
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
        )}
      </AnimatePresence>

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary",
          isOpen && "opacity-100"
        )}
      >
        <MoreHorizontal size={16} className="text-muted-foreground" />
      </button>
    </div>
  );
};

export default MessageActions;
