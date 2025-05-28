
import React from 'react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import MessageActions from './MessageActions';
import VoiceMessageBubble from './VoiceMessageBubble';

interface MessageBubbleProps {
  messageId: string;
  content: string;
  timestamp: string;
  isSender: boolean;
  senderId: string;
  currentUserId: string;
  status?: 'sent' | 'delivered' | 'read';
  isNew?: boolean;
  isDeleted?: boolean;
  isEdited?: boolean;
  messageType?: 'text' | 'voice';
  audioUrl?: string;
  audioDuration?: number;
  onEdit?: (messageId: string, newContent: string) => void;
  onUnsend?: (messageId: string) => void;
  onReply?: (content: string) => void;
}

const MessageBubble = ({
  messageId,
  content,
  timestamp,
  isSender,
  senderId,
  currentUserId,
  status = 'sent',
  isNew = false,
  isDeleted = false,
  isEdited = false,
  messageType = 'text',
  audioUrl,
  audioDuration,
  onEdit,
  onUnsend,
  onReply
}: MessageBubbleProps) => {
  // Handle voice messages
  if (messageType === 'voice' && audioUrl && audioDuration !== undefined) {
    return (
      <VoiceMessageBubble
        messageId={messageId}
        audioUrl={audioUrl}
        duration={audioDuration || 1} // Default to 1 second if duration is 0
        timestamp={timestamp}
        isSender={isSender}
        senderId={senderId}
        currentUserId={currentUserId}
        status={status}
        isNew={isNew}
        isDeleted={isDeleted}
        onUnsend={onUnsend}
        onReply={onReply}
      />
    );
  }

  // Animation variants
  const containerVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 350,
        damping: 25,
        mass: 0.5
      }
    }
  };

  // Status icon animation variants
  const statusVariants = {
    sent: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.2, ease: "easeOut" }
    },
    delivered: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    read: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  // Handle deleted messages
  if (isDeleted) {
    return (
      <motion.div
        className={cn(
          "max-w-[80%] mb-3 flex flex-col opacity-60",
          isSender ? "ml-auto items-end" : "mr-auto items-start"
        )}
        initial="initial"
        animate="animate"
        variants={containerVariants}
        layout
        layoutId={`message-${timestamp}-${content.slice(0, 10)}`}
      >
        <div className="px-4 py-2 rounded-2xl bg-secondary/50 text-muted-foreground italic text-sm">
          This message was unsent
        </div>
        <div className="flex items-center mt-1 text-xs text-muted-foreground">
          <span>
            {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(
        "max-w-[80%] mb-3 flex flex-col",
        isSender ? "ml-auto items-end" : "mr-auto items-start"
      )}
      initial="initial"
      animate="animate"
      variants={containerVariants}
      layout
      layoutId={`message-${timestamp}-${content.slice(0, 10)}`}
    >
      <motion.div
        className={cn(
          "px-4 py-2 rounded-2xl break-words max-w-xs relative",
          isSender
            ? "bg-nuumi-pink text-white rounded-br-none"
            : "bg-secondary text-foreground rounded-bl-none"
        )}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {content}
        {isEdited && (
          <span className="text-xs opacity-70 ml-2">(edited)</span>
        )}

        {/* Message Actions - Hidden, will be triggered by long press */}
        <MessageActions
          messageId={messageId}
          content={content}
          senderId={senderId}
          currentUserId={currentUserId}
          createdAt={timestamp}
          isDeleted={isDeleted}
          isEdited={isEdited}
          onEdit={onEdit}
          onUnsend={onUnsend}
          onReply={onReply}
        />
      </motion.div>

      <div className="flex items-center mt-1 text-xs text-muted-foreground">
        <span>
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </span>

        {isSender && (
          <motion.span
            className="ml-1 flex items-center"
            initial="sent"
            animate={status}
            variants={statusVariants}
          >
            {status === 'sent' && (
              <Check size={12} className="text-muted-foreground" />
            )}
            {status === 'delivered' && (
              <CheckCheck size={12} className="text-muted-foreground" />
            )}
            {status === 'read' && (
              <CheckCheck size={12} className="text-nuumi-pink" />
            )}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
