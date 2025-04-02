
import React from 'react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  content: string;
  timestamp: string;
  isSender: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

const MessageBubble = ({ content, timestamp, isSender, status = 'sent' }: MessageBubbleProps) => {
  return (
    <div 
      className={cn(
        "max-w-[80%] mb-3 flex flex-col",
        isSender ? "ml-auto items-end" : "mr-auto items-start"
      )}
    >
      <div 
        className={cn(
          "px-4 py-2 rounded-2xl break-words",
          isSender 
            ? "bg-nuumi-pink text-white rounded-br-none" 
            : "bg-secondary text-foreground rounded-bl-none"
        )}
      >
        {content}
      </div>
      
      <div className="flex items-center mt-1 text-xs text-muted-foreground">
        <span>
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </span>
        
        {isSender && (
          <span className="ml-1">
            {status === 'sent' && <Check size={12} />}
            {status === 'delivered' && <CheckCheck size={12} />}
            {status === 'read' && <CheckCheck size={12} className="text-nuumi-pink" />}
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
