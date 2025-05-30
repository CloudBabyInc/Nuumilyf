
import React, { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
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
}

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  isLoading?: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onUnsendMessage?: (messageId: string) => void;
  onReplyToMessage?: (content: string) => void;
}

const MessageList = ({
  messages,
  currentUserId,
  isLoading = false,
  onEditMessage,
  onUnsendMessage,
  onReplyToMessage
}: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [renderedMessages, setRenderedMessages] = useState<Message[]>([]);

  // Update rendered messages with smooth transitions
  useEffect(() => {
    if (messages.length > renderedMessages.length) {
      // New messages added
      const newMessages = messages.map((msg, index) => {
        const existingMsg = renderedMessages.find(m =>
          m.id === msg.id ||
          (m.id.startsWith('temp-') && msg.content === m.content && msg.senderId === m.senderId)
        );

        return {
          ...msg,
          isNew: !existingMsg && index >= renderedMessages.length
        };
      });
      setRenderedMessages(newMessages);
    } else if (messages.length === renderedMessages.length) {
      // Update existing messages (status changes, ID updates)
      const updatedMessages = messages.map(msg => {
        const existingMsg = renderedMessages.find(m =>
          m.id === msg.id ||
          (m.id.startsWith('temp-') && msg.content === m.content && msg.senderId === m.senderId)
        );

        return {
          ...msg,
          isNew: existingMsg?.isNew || false
        };
      });

      // Only update if there are actual changes to prevent unnecessary re-renders
      const hasChanges = updatedMessages.some((msg, index) => {
        const existing = renderedMessages[index];
        return !existing ||
               msg.id !== existing.id ||
               msg.status !== existing.status ||
               msg.content !== existing.content;
      });

      if (hasChanges) {
        setRenderedMessages(updatedMessages);
      }
    } else {
      // Messages removed (error cases)
      setRenderedMessages(messages.map(msg => ({ ...msg, isNew: false })));
    }
  }, [messages]);

  useEffect(() => {
    // Scroll to bottom when messages change
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [renderedMessages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-nuumi-pink" />
      </div>
    );
  }

  if (renderedMessages.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <motion.p
          className="text-muted-foreground text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          No messages yet.<br />
          Start the conversation by sending a message.
        </motion.p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { [date: string]: Message[] } = {};
  renderedMessages.forEach(message => {
    const date = new Date(message.timestamp).toLocaleDateString();
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  return (
    <div className="p-3 flex-1 overflow-y-auto">
      <AnimatePresence>
        {Object.entries(groupedMessages).map(([date, messagesGroup]) => (
          <div key={date}>
            <motion.div
              className="flex justify-center my-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-xs text-muted-foreground bg-background/90 px-3 py-1 rounded-full">
                {date === new Date().toLocaleDateString() ? 'Today' : date}
              </span>
            </motion.div>
            <AnimatePresence mode="popLayout">
              {messagesGroup.map((message, index) => {
                // Create a stable key that doesn't change when temp ID becomes real ID
                const stableKey = message.id.startsWith('temp-')
                  ? `${message.senderId}-${message.timestamp}-${index}`
                  : message.id;

                return (
                  <MessageBubble
                    key={stableKey}
                    messageId={message.id}
                    content={message.content}
                    timestamp={message.timestamp}
                    isSender={message.senderId === currentUserId}
                    senderId={message.senderId}
                    currentUserId={currentUserId || ''}
                    status={message.status}
                    isNew={message.isNew}
                    isDeleted={message.isDeleted}
                    isEdited={message.isEdited}
                    messageType={message.messageType}
                    audioUrl={message.audioUrl}
                    audioDuration={message.audioDuration}
                    attachmentUrl={message.attachmentUrl}
                    fileName={message.fileName}
                    fileSize={message.fileSize}
                    onEdit={onEditMessage}
                    onUnsend={onUnsendMessage}
                    onReply={onReplyToMessage}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
