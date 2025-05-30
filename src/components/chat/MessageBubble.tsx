
import React from 'react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck, FileText, Download, Eye } from 'lucide-react';
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
  messageType?: 'text' | 'voice' | 'image' | 'document';
  audioUrl?: string;
  audioDuration?: number;
  attachmentUrl?: string;
  fileName?: string;
  fileSize?: number;
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
  attachmentUrl,
  fileName,
  fileSize,
  onEdit,
  onUnsend,
  onReply
}: MessageBubbleProps) => {
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

  // Helper function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle image attachments
  if (messageType === 'image' && attachmentUrl) {
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
            "rounded-2xl overflow-hidden max-w-xs relative",
            isSender
              ? "bg-nuumi-pink/10 rounded-br-none"
              : "bg-secondary rounded-bl-none"
          )}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <img
            src={attachmentUrl}
            alt={fileName || 'Image'}
            className="w-full h-auto max-h-64 object-cover cursor-pointer"
            onClick={() => window.open(attachmentUrl, '_blank')}
          />

          {/* Image overlay with actions */}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <motion.button
              onClick={() => window.open(attachmentUrl, '_blank')}
              className="p-2 bg-white/90 rounded-full text-gray-800 hover:bg-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Eye size={16} />
            </motion.button>
          </div>

          {/* Message Actions */}
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
  }

  // Handle document attachments
  if (messageType === 'document' && attachmentUrl) {
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
            "px-4 py-3 rounded-2xl max-w-xs relative border",
            isSender
              ? "bg-nuumi-pink text-white rounded-br-none border-nuumi-pink/20"
              : "bg-secondary text-foreground rounded-bl-none border-border"
          )}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <div className="flex items-center space-x-3">
            <div className={cn(
              "p-2 rounded-lg",
              isSender ? "bg-white/20" : "bg-primary/10"
            )}>
              <FileText size={20} className={isSender ? "text-white" : "text-primary"} />
            </div>

            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-medium text-sm truncate",
                isSender ? "text-white" : "text-foreground"
              )}>
                {fileName || 'Document'}
              </p>
              {fileSize && (
                <p className={cn(
                  "text-xs opacity-70",
                  isSender ? "text-white" : "text-muted-foreground"
                )}>
                  {formatFileSize(fileSize)}
                </p>
              )}
            </div>

            <motion.button
              onClick={() => window.open(attachmentUrl, '_blank')}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                isSender
                  ? "bg-white/20 hover:bg-white/30 text-white"
                  : "bg-primary/10 hover:bg-primary/20 text-primary"
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download size={14} />
            </motion.button>
          </div>

          {/* Message Actions */}
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
  }

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
