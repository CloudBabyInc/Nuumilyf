
import React, { useState, useRef, useEffect } from 'react';
import { Smile, PaperClip, Send, Image, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const MessageInput = ({ onSendMessage, isLoading = false, disabled = false }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto resize the textarea based on content
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [message]);
  
  const handleSend = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Reset height after sending
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="p-3 border-t border-border/20 bg-background sticky bottom-0">
      <div className="flex items-end rounded-full border border-border/50 bg-card/30 px-3 py-2">
        <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <Smile size={20} />
        </button>
        
        <div className="flex space-x-1 mr-2">
          <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <PaperClip size={20} />
          </button>
          <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Image size={20} />
          </button>
          <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Mic size={20} />
          </button>
        </div>
        
        <textarea
          ref={inputRef}
          className={cn(
            "flex-1 bg-transparent border-none resize-none max-h-[120px] focus:outline-none text-foreground placeholder:text-muted-foreground py-2",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          placeholder="Type a message..."
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
        />
        
        <button 
          className={cn(
            "ml-2 p-2 rounded-full transition-colors",
            message.trim() && !isLoading && !disabled 
              ? "bg-nuumi-pink text-white hover:bg-nuumi-pink/90" 
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
          onClick={handleSend}
          disabled={!message.trim() || isLoading || disabled}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
