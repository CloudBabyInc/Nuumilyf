
import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Loader2 } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
  status?: 'sent' | 'delivered' | 'read';
}

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  isLoading?: boolean;
}

const MessageList = ({ messages, currentUserId, isLoading = false }: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-nuumi-pink" />
      </div>
    );
  }
  
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-muted-foreground text-center">
          No messages yet.<br />
          Start the conversation by sending a message.
        </p>
      </div>
    );
  }
  
  // Group messages by date
  const groupedMessages: { [date: string]: Message[] } = {};
  messages.forEach(message => {
    const date = new Date(message.timestamp).toLocaleDateString();
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });
  
  return (
    <div className="p-3 flex-1 overflow-y-auto">
      {Object.entries(groupedMessages).map(([date, messagesGroup]) => (
        <div key={date}>
          <div className="flex justify-center my-3">
            <span className="text-xs text-muted-foreground bg-background/90 px-3 py-1 rounded-full">
              {date === new Date().toLocaleDateString() ? 'Today' : date}
            </span>
          </div>
          {messagesGroup.map(message => (
            <MessageBubble
              key={message.id}
              content={message.content}
              timestamp={message.timestamp}
              isSender={message.senderId === currentUserId}
              status={message.status}
            />
          ))}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
