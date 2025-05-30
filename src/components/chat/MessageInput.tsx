
import React, { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Send, Image, Mic, Loader2, X, Play, Pause, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import AttachmentModal from './AttachmentModal';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onSendVoiceMessage?: (audioBlob: Blob, duration: number) => void;
  onSendAttachment?: (file: File, type: 'image' | 'document') => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const MessageInput = ({ onSendMessage, onSendVoiceMessage, onSendAttachment, isLoading = false, disabled = false }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(128));
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingStartTime = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Auto resize the textarea based on content
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleSend = async () => {
    if (message.trim() && !isLoading && !disabled && !isSending) {
      setIsSending(true);

      try {
        await onSendMessage(message.trim());
        setMessage('');

        // Reset height after sending
        if (inputRef.current) {
          inputRef.current.style.height = 'auto';
        }
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Audio analysis functions
  const startAudioAnalysis = () => {
    if (!analyzerRef.current) return;

    const analyzer = analyzerRef.current;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateAudioData = () => {
      if (!analyzer || !isRecording) {
        stopAudioAnalysis();
        return;
      }

      analyzer.getByteFrequencyData(dataArray);

      // Calculate average volume level with better sensitivity
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const normalizedLevel = Math.min(average / 64, 1); // More sensitive (was /128)

      // Add some baseline activity even when quiet
      const enhancedLevel = Math.max(normalizedLevel, 0.1);

      // Debug logging (remove in production)
      if (Math.random() < 0.01) { // Log 1% of the time to avoid spam
        console.log('Audio level:', enhancedLevel, 'Average:', average, 'Data sample:', dataArray.slice(0, 10));
      }

      setAudioLevel(enhancedLevel);
      setFrequencyData(new Uint8Array(dataArray));

      if (isRecording) {
        animationFrameRef.current = requestAnimationFrame(updateAudioData);
      }
    };

    updateAudioData();
  };

  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAudioLevel(0);
    setFrequencyData(new Uint8Array(128));
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000, // High quality sample rate
          sampleSize: 16, // 16-bit audio
          channelCount: 1, // Mono for voice
          volume: 1.0, // Maximum volume
          latency: 0.01 // Low latency
        }
      });

      streamRef.current = stream;

      // Create audio context for processing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create audio processing chain for better quality
      const source = audioContext.createMediaStreamSource(stream);
      const gainNode = audioContext.createGain();
      const compressor = audioContext.createDynamicsCompressor();
      const filter = audioContext.createBiquadFilter();

      // Configure audio processing
      gainNode.gain.value = 3.0; // Boost volume by 3x for better detection
      gainNodeRef.current = gainNode;

      // Configure compressor for consistent levels
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;

      // Configure high-pass filter to reduce low-frequency noise
      filter.type = 'highpass';
      filter.frequency.value = 80; // Remove frequencies below 80Hz
      filter.Q.value = 1;

      // Create analyzer for real-time audio visualization
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 512; // Increased for better frequency resolution
      analyzer.smoothingTimeConstant = 0.3; // Less smoothing for more responsive visuals
      analyzer.minDecibels = -90;
      analyzer.maxDecibels = -10;
      analyzerRef.current = analyzer;

      // Connect the audio processing chain - IMPORTANT: Connect source to analyzer FIRST
      source.connect(analyzer); // Direct connection for visualization
      source.connect(filter);
      filter.connect(compressor);
      compressor.connect(gainNode);

      // Create destination for processed audio
      const destination = audioContext.createMediaStreamDestination();
      gainNode.connect(destination);

      // Use the processed stream for recording
      const processedStream = destination.stream;

      // Try different codecs for better quality
      let mimeType = 'audio/webm;codecs=opus';
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/mp4;codecs=mp4a.40.2', // AAC
        'audio/webm;codecs=pcm',
        'audio/wav'
      ];

      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(processedStream, {
        mimeType,
        audioBitsPerSecond: 128000 // 128 kbps for good quality
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        setRecordedBlob(audioBlob);

        // Calculate actual recording duration
        const actualDuration = Math.max(1, Math.floor((Date.now() - recordingStartTime.current) / 1000));
        setRecordedDuration(actualDuration);

        // Create audio URL for playback
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Stop all tracks and close audio context
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      recordingStartTime.current = Date.now();

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start real-time audio analysis
      console.log('Starting audio analysis with analyzer:', analyzer);
      setTimeout(() => {
        startAudioAnalysis();
      }, 100); // Small delay to ensure everything is connected

    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopAudioAnalysis();

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (isRecording) {
      stopRecording();
    }
    stopAudioAnalysis();
    setRecordedBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setRecordedDuration(0);
    setIsPlaying(false);

    // Clean up audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const sendVoiceMessage = async () => {
    if (recordedBlob && onSendVoiceMessage) {
      await onSendVoiceMessage(recordedBlob, recordedDuration);
      cancelRecording();
    }
  };

  const handleAttachmentSend = async (file: File, type: 'image' | 'document') => {
    if (!onSendAttachment) return;

    setIsUploadingAttachment(true);
    try {
      await onSendAttachment(file, type);
      setShowAttachmentModal(false);
    } catch (error) {
      console.error('Error sending attachment:', error);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle mouse/touch events for hold-to-record
  const handleMicMouseDown = () => {
    if (!recordedBlob) {
      startRecording();
    }
  };

  const handleMicMouseUp = () => {
    if (isRecording && recordingTime < 1) {
      // If recording for less than 1 second, cancel
      cancelRecording();
    } else if (isRecording) {
      // Stop recording
      stopRecording();
    }
  };

  // Audio element event handlers
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      const audio = audioRef.current;

      const handleEnded = () => {
        setIsPlaying(false);
      };

      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioUrl]);

  return (
    <motion.div
      className="p-3 border-t border-border/20 bg-background sticky bottom-0"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <AnimatePresence mode="wait">
        {isRecording ? (
          // PURE GRADIENT AMBIENCE - NO ICONS, JUST BEAUTY
          <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            className="fixed inset-0 z-50"
            style={{
              background: `
                radial-gradient(ellipse at center,
                  rgba(59, 130, 246, ${0.4 + audioLevel * 0.6}) 0%,
                  rgba(147, 51, 234, ${0.3 + audioLevel * 0.5}) 25%,
                  rgba(236, 72, 153, ${0.2 + audioLevel * 0.4}) 50%,
                  rgba(14, 165, 233, ${0.1 + audioLevel * 0.3}) 75%,
                  rgba(6, 182, 212, ${0.05 + audioLevel * 0.2}) 100%
                ),
                linear-gradient(135deg,
                  rgba(59, 130, 246, ${0.2 + audioLevel * 0.3}) 0%,
                  rgba(147, 51, 234, ${0.15 + audioLevel * 0.25}) 33%,
                  rgba(236, 72, 153, ${0.1 + audioLevel * 0.2}) 66%,
                  rgba(14, 165, 233, ${0.05 + audioLevel * 0.15}) 100%
                )
              `,
              transition: 'all 0.3s ease-out'
            }}
            onClick={(e) => {
              e.preventDefault();
              if (recordingTime >= 1) {
                stopRecording();
              } else {
                cancelRecording();
              }
            }}
          >
            {/* Dynamic Gradient Waves */}
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(circle at ${30 + i * 10}% ${40 + i * 5}%,
                      rgba(255, 255, 255, ${0.05 + audioLevel * 0.15}) 0%,
                      transparent ${20 + audioLevel * 30}%
                    )`
                  }}
                  animate={{
                    scale: [1, 1.2 + audioLevel * 0.8, 1],
                    opacity: [0.3, 0.7 + audioLevel * 0.3, 0.3],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>

            {/* Floating Particles */}
            <div className="absolute inset-0">
              {Array.from({ length: 40 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: `${2 + Math.random() * 4}px`,
                    height: `${2 + Math.random() * 4}px`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    background: `rgba(255, 255, 255, ${0.1 + audioLevel * 0.3})`
                  }}
                  animate={{
                    y: [0, -100 - audioLevel * 50],
                    opacity: [0, 0.8 + audioLevel * 0.2, 0],
                    scale: [0.5, 1 + audioLevel * 0.5, 0.5],
                  }}
                  transition={{
                    duration: 4 + Math.random() * 3,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: "easeOut"
                  }}
                />
              ))}
            </div>

            {/* Central Frequency Visualization */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="flex items-end space-x-1"
                animate={{
                  scale: [0.8, 1 + audioLevel * 0.3, 0.8],
                }}
                transition={{ duration: 0.5 }}
              >
                {Array.from({ length: 60 }).map((_, i) => {
                  const frequency = frequencyData[Math.floor(i * (frequencyData.length / 60))] || 0;
                  const height = Math.max(4, (frequency / 255) * 200 + audioLevel * 100);
                  const opacity = 0.3 + (frequency / 255) * 0.7 + audioLevel * 0.3;

                  return (
                    <motion.div
                      key={i}
                      className="rounded-full"
                      style={{
                        width: '2px',
                        height: `${height}px`,
                        background: `rgba(255, 255, 255, ${opacity})`,
                        filter: `blur(${audioLevel * 2}px)`
                      }}
                      animate={{
                        scaleY: [0.5, 1 + audioLevel * 0.5, 0.5],
                        opacity: [opacity * 0.5, opacity, opacity * 0.5],
                      }}
                      transition={{
                        duration: 0.2,
                        delay: i * 0.01,
                        ease: "easeOut"
                      }}
                    />
                  );
                })}
              </motion.div>
            </div>

            {/* Subtle Recording Info */}
            <motion.div
              className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center"
              animate={{
                opacity: [0.6, 1, 0.6],
                y: [0, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="text-black/90 dark:text-white/90 text-sm font-light tracking-wider mb-2">
                Recording
              </div>
              <div className="text-black/70 dark:text-white/70 font-mono text-lg">
                {formatTime(recordingTime)}
              </div>
            </motion.div>

            {/* Tap to stop hint */}
            <motion.div
              className="absolute top-20 left-1/2 transform -translate-x-1/2 text-center"
              animate={{
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="text-black/60 dark:text-white/60 text-xs font-light tracking-widest">
                TAP ANYWHERE TO STOP
              </div>
            </motion.div>
          </motion.div>
        ) : recordedBlob ? (
          // Preview Mode
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center space-x-3 bg-nuumi-pink/10 border border-nuumi-pink/20 rounded-full px-4 py-3"
          >
            <motion.button
              onClick={togglePlayback}
              className="p-2 bg-nuumi-pink text-white rounded-full hover:bg-nuumi-pink/90 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </motion.button>

            {/* Waveform visualization */}
            <div className="flex items-center space-x-1 flex-1">
              {Array.from({ length: 15 }).map((_, i) => {
                const height = Math.random() * 16 + 8;
                return (
                  <motion.div
                    key={i}
                    className="w-1 bg-nuumi-pink rounded-full"
                    style={{ height: `${height}px` }}
                    animate={isPlaying ? { scaleY: [1, 1.5, 1] } : {}}
                    transition={{
                      duration: 0.5,
                      repeat: isPlaying ? Infinity : 0,
                      delay: i * 0.1
                    }}
                  />
                );
              })}
            </div>

            <span className="text-nuumi-pink font-mono text-sm">{formatTime(recordedDuration)}</span>

            <motion.button
              onClick={cancelRecording}
              className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trash2 size={16} />
            </motion.button>

            <motion.button
              onClick={sendVoiceMessage}
              className="p-2 bg-nuumi-pink text-white rounded-full hover:bg-nuumi-pink/90 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send size={16} />
            </motion.button>

            {audioUrl && (
              <audio ref={audioRef} src={audioUrl} preload="metadata" />
            )}
          </motion.div>
        ) : (
          // Normal Mode
          <motion.div
            key="normal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-end rounded-full border border-border/50 bg-card/30 px-3 py-2"
          >
            <motion.button
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Smile size={20} />
            </motion.button>

            <div className="flex space-x-1 mr-2">
              <motion.button
                onClick={() => setShowAttachmentModal(true)}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                disabled={disabled || isLoading}
              >
                <Paperclip size={20} />
              </motion.button>
              <motion.button
                onClick={() => setShowAttachmentModal(true)}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                disabled={disabled || isLoading}
              >
                <Image size={20} />
              </motion.button>
            </div>

            <textarea
              ref={inputRef}
              className={cn(
                "flex-1 bg-transparent border-none resize-none max-h-[120px] focus:outline-none text-foreground placeholder:text-muted-foreground py-2",
                (disabled || isSending) && "opacity-50 cursor-not-allowed"
              )}
              placeholder="Type a message..."
              rows={1}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled || isLoading || isSending}
            />

            {message.trim() ? (
              <motion.button
                className="ml-2 p-2 rounded-full bg-nuumi-pink text-white hover:bg-nuumi-pink/90 transition-colors flex items-center justify-center"
                onClick={handleSend}
                disabled={isLoading || disabled || isSending}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait">
                  {isSending ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, rotate: 0 }}
                      animate={{ opacity: 1, rotate: 360 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 size={18} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="send"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Send size={18} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ) : (
              <motion.button
                className="ml-2 p-2 rounded-full bg-nuumi-pink text-white hover:bg-nuumi-pink/90 transition-colors select-none"
                onMouseDown={handleMicMouseDown}
                onMouseUp={handleMicMouseUp}
                onTouchStart={handleMicMouseDown}
                onTouchEnd={handleMicMouseUp}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Mic size={18} />
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachment Modal */}
      <AttachmentModal
        isOpen={showAttachmentModal}
        onClose={() => setShowAttachmentModal(false)}
        onSendAttachment={handleAttachmentSend}
        isLoading={isUploadingAttachment}
      />
    </motion.div>
  );
};

export default MessageInput;
