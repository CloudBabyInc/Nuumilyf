import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import MessageActions from './MessageActions';

interface VoiceMessageBubbleProps {
  messageId: string;
  audioUrl: string;
  duration: number;
  timestamp: string;
  isSender: boolean;
  senderId: string;
  currentUserId: string;
  status?: 'sent' | 'delivered' | 'read';
  isNew?: boolean;
  isDeleted?: boolean;
  onUnsend?: (messageId: string) => void;
  onReply?: (content: string) => void;
}

const VoiceMessageBubble: React.FC<VoiceMessageBubbleProps> = ({
  messageId,
  audioUrl,
  duration,
  timestamp,
  isSender,
  senderId,
  currentUserId,
  status = 'sent',
  isNew = false,
  isDeleted = false,
  onUnsend,
  onReply
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle play/pause
  const togglePlayback = async () => {
    if (!audioRef.current) return;

    try {
      setIsLoading(true);

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      setIsLoading(false);
    }
  };



  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      console.error('Error loading audio');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

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

  const statusVariants = {
    sent: { scale: 1, opacity: 0.7 },
    delivered: { scale: 1.1, opacity: 1 },
    read: { scale: 1.1, opacity: 1 }
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
        layoutId={`voice-message-${messageId}`}
      >
        <div className="px-4 py-2 rounded-2xl bg-secondary/50 text-muted-foreground italic text-sm">
          This voice message was unsent
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
        "max-w-[80%] mb-3 flex flex-col group",
        isSender ? "ml-auto items-end" : "mr-auto items-start"
      )}
      initial="initial"
      animate="animate"
      variants={containerVariants}
      layout
      layoutId={`voice-message-${messageId}`}
    >
      <motion.div
        className={cn(
          "px-4 py-3 rounded-2xl relative min-w-[200px]",
          isSender
            ? "bg-nuumi-pink text-white rounded-br-none"
            : "bg-secondary text-foreground rounded-bl-none"
        )}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="flex items-center space-x-3">
          {/* Play/Pause Button */}
          <motion.button
            onClick={togglePlayback}
            disabled={isLoading}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              isSender
                ? "bg-white/20 hover:bg-white/30 text-white"
                : "bg-nuumi-pink hover:bg-nuumi-pink/90 text-white",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              />
            ) : isPlaying ? (
              <Pause size={16} />
            ) : (
              <Play size={16} className="ml-0.5" />
            )}
          </motion.button>

          {/* Waveform/Progress Area */}
          <div className="flex-1 space-y-2">
            {/* Waveform visualization (simplified bars) */}
            <div className="flex items-center space-x-1 h-6">
              {Array.from({ length: 20 }).map((_, i) => {
                const isActive = (currentTime / duration) * 20 > i;
                const height = Math.random() * 16 + 8; // Random heights between 8-24px

                return (
                  <motion.div
                    key={i}
                    className={cn(
                      "w-1 rounded-full transition-colors",
                      isActive
                        ? isSender ? "bg-white" : "bg-nuumi-pink"
                        : isSender ? "bg-white/30" : "bg-muted-foreground/30"
                    )}
                    style={{ height: `${height}px` }}
                    animate={isPlaying && isActive ? { scaleY: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.5, repeat: isPlaying && isActive ? Infinity : 0 }}
                  />
                );
              })}
            </div>

            {/* Time display */}
            <div className={cn(
              "text-xs",
              isSender ? "text-white/80" : "text-muted-foreground"
            )}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>

        {/* Hidden audio element */}
        <audio ref={audioRef} src={audioUrl} preload="metadata" />

        {/* Message Actions */}
        <MessageActions
          messageId={messageId}
          content="Voice message"
          senderId={senderId}
          currentUserId={currentUserId}
          createdAt={timestamp}
          isDeleted={isDeleted}
          onUnsend={onUnsend}
          onReply={onReply}
          audioUrl={audioUrl}
          isVoiceMessage={true}
        />
      </motion.div>

      {/* Timestamp and status */}
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

export default VoiceMessageBubble;
