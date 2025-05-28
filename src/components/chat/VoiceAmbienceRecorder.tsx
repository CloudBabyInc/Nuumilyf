import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface VoiceAmbienceRecorderProps {
  onSendVoiceMessage: (audioBlob: Blob, duration: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

// Voice-Responsive Vertical Bars Ambience
const VoiceAmbienceCanvas = ({ audioData, isRecording }: { audioData: Uint8Array; isRecording: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollPositionRef = useRef(0);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const numLines = Math.floor(canvas.width / 12); // Responsive line count
    const lineSpacing = canvas.width / numLines;

    // Calculate voice intensity for dynamic effects
    const getVoiceIntensity = () => {
      const average = audioData.reduce((sum, value) => sum + value, 0) / audioData.length;
      return average / 255;
    };

    // Create voice-responsive patterns
    const createPattern = (offset: number, voiceIntensity: number) => {
      const pattern = [];
      for (let i = 0; i < numLines; i++) {
        const bars = [];
        const baseNumBars = 8 + Math.sin(i * 0.3 + offset) * 4;
        const voiceNumBars = isRecording ? baseNumBars + voiceIntensity * 6 : baseNumBars;

        for (let j = 0; j < voiceNumBars; j++) {
          const voiceAmplitude = isRecording ? voiceIntensity * 60 : 20;
          const frequencyValue = audioData[Math.floor((i / numLines) * audioData.length)] || 0;
          const normalizedFreq = frequencyValue / 255;

          bars.push({
            y: (j / voiceNumBars) * canvas.height +
                Math.sin(i * 0.5 + j * 0.3 + offset) * voiceAmplitude +
                normalizedFreq * 40,
            height: 3 + Math.sin(i * 0.2 + j * 0.4) * 2 + voiceIntensity * 8,
            width: 1.5 + Math.cos(i * 0.3) * 1.5 + voiceIntensity * 3,
            opacity: 0.6 + voiceIntensity * 0.4
          });
        }
        pattern.push(bars);
      }
      return pattern;
    };

    const animate = () => {
      const voiceIntensity = getVoiceIntensity();

      // Dynamic scroll speed based on voice
      const baseSpeed = 0.002;
      const voiceSpeed = isRecording ? baseSpeed + voiceIntensity * 0.008 : baseSpeed;
      scrollPositionRef.current += voiceSpeed;

      const scrollFactor = (Math.sin(scrollPositionRef.current) + 1) / 2;

      // Voice-responsive background colors
      const baseHue = 280; // Purple-blue base
      const voiceHue = isRecording ? (baseHue + voiceIntensity * 60) % 360 : baseHue;
      const saturation = isRecording ? 40 + voiceIntensity * 30 : 20;
      const lightness = isRecording ? 8 + voiceIntensity * 12 : 5;

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, `hsla(${voiceHue}, ${saturation}%, ${lightness + 5}%, 0.9)`);
      gradient.addColorStop(0.5, `hsla(${voiceHue + 20}, ${saturation}%, ${lightness}%, 0.7)`);
      gradient.addColorStop(1, `hsla(${voiceHue + 40}, ${saturation}%, ${lightness + 3}%, 0.9)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create patterns
      const pattern1 = createPattern(0, voiceIntensity);
      const pattern2 = createPattern(Math.PI, voiceIntensity);

      // Draw lines and interpolated bars
      for (let i = 0; i < numLines; i++) {
        const x = i * lineSpacing + lineSpacing / 2;

        // Voice-responsive line color
        const lineHue = voiceHue + i * 2;
        const lineOpacity = isRecording ? 0.3 + voiceIntensity * 0.4 : 0.2;

        // Draw vertical line
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${lineHue}, 60%, 70%, ${lineOpacity})`;
        ctx.lineWidth = isRecording ? 1 + voiceIntensity * 2 : 0.5;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();

        // Interpolate between patterns
        const bars1 = pattern1[i] || [];
        const bars2 = pattern2[i] || [];
        const maxBars = Math.max(bars1.length, bars2.length);

        for (let j = 0; j < maxBars; j++) {
          const bar1 = bars1[j] || bars2[j] || bars1[0];
          const bar2 = bars2[j] || bars1[j] || bars2[0];

          if (!bar1 || !bar2) continue;

          const y = bar1.y + (bar2.y - bar1.y) * scrollFactor;
          const height = bar1.height + (bar2.height - bar1.height) * scrollFactor;
          const width = bar1.width + (bar2.width - bar1.width) * scrollFactor;
          const opacity = bar1.opacity + (bar2.opacity - bar1.opacity) * scrollFactor;

          // Voice-responsive bar colors
          const barHue = voiceHue + i * 3 + j * 5;
          const barSaturation = isRecording ? 70 + voiceIntensity * 20 : 40;
          const barLightness = isRecording ? 60 + voiceIntensity * 30 : 50;

          ctx.fillStyle = `hsla(${barHue}, ${barSaturation}%, ${barLightness}%, ${opacity})`;
          ctx.fillRect(x - width/2, y - height/2, width, height);

          // Add glow effect for high voice intensity
          if (isRecording && voiceIntensity > 0.3) {
            ctx.shadowColor = `hsla(${barHue}, 80%, 70%, ${voiceIntensity})`;
            ctx.shadowBlur = voiceIntensity * 20;
            ctx.fillRect(x - width/2, y - height/2, width, height);
            ctx.shadowBlur = 0;
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }

      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      scrollPositionRef.current = 0;
    };
  }, [audioData, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{
        filter: isRecording ? 'blur(0.5px) brightness(1.1)' : 'blur(1px)',
        transition: 'filter 0.3s ease'
      }}
    />
  );
};

// Particle Overlay Component
const ParticleOverlay = ({ audioData, isRecording }: { audioData: Uint8Array; isRecording: boolean }) => {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    speed: Math.random() * 0.5 + 0.1,
  }));

  const average = audioData.reduce((sum, value) => sum + value, 0) / audioData.length;
  const intensity = average / 255;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white/20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            scale: isRecording ? [1, 1 + intensity, 1] : 1,
            opacity: isRecording ? [0.3, 0.8, 0.3] : 0.2,
            y: [0, -20, 0],
          }}
          transition={{
            duration: 2 + particle.speed,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Audio Visualizer Bars
const AudioVisualizer = ({ audioData, isRecording }: { audioData: Uint8Array; isRecording: boolean }) => {
  const bars = Array.from({ length: 32 }, (_, i) => {
    const value = audioData[i] || 0;
    const height = (value / 255) * 100;
    return { id: i, height: Math.max(height, 5) };
  });

  return (
    <div className="flex items-end justify-center space-x-1 h-20">
      {bars.map((bar, index) => (
        <motion.div
          key={bar.id}
          className="bg-gradient-to-t from-primary/60 to-primary/20 rounded-full"
          style={{
            width: '3px',
            height: `${bar.height}%`,
          }}
          animate={{
            height: isRecording ? `${bar.height}%` : '10%',
            opacity: isRecording ? 0.8 : 0.3,
          }}
          transition={{
            duration: 0.1,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

export const VoiceAmbienceRecorder: React.FC<VoiceAmbienceRecorderProps> = ({
  onSendVoiceMessage,
  isOpen,
  onClose,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(128));
  const [transcript, setTranscript] = useState('');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Audio analysis function
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    setAudioData(dataArray);

    if (isRecording) {
      animationRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, [isRecording]);

  // Start recording with full audio analysis
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        }
      });

      streamRef.current = stream;

      // Set up audio context for real-time analysis
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000,
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
      };

      // Start recording and analysis
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start audio analysis
      analyzeAudio();

      // Set up speech recognition
      if ('webkitSpeechRecognition' in window) {
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setTranscript(finalTranscript);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  // Send voice message
  const sendVoiceMessage = () => {
    if (recordedBlob) {
      onSendVoiceMessage(recordedBlob, recordingTime);
      onClose();
      setRecordedBlob(null);
      setTranscript('');
      setRecordingTime(0);
    }
  };

  // Cancel recording
  const cancelRecording = () => {
    stopRecording();
    setRecordedBlob(null);
    setTranscript('');
    setRecordingTime(0);
    onClose();
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl"
        >
          {/* Voice-Responsive Canvas Background */}
          <VoiceAmbienceCanvas audioData={audioData} isRecording={isRecording} />

          {/* Particle Overlay */}
          <ParticleOverlay audioData={audioData} isRecording={isRecording} />

          {/* Frosted Glass Interface */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card bg-white/5 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center border border-white/10"
            >
              {/* Recording Status */}
              <motion.div
                animate={{ scale: isRecording ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}
                className="mb-6"
              >
                <div className={cn(
                  "w-4 h-4 rounded-full mx-auto mb-4",
                  isRecording ? "bg-red-500" : "bg-gray-400"
                )} />
                <p className="text-white/80 font-caslon-medium text-lg">
                  {isRecording ? 'Recording...' : recordedBlob ? 'Recording Complete' : 'Ready to Record'}
                </p>
                <p className="text-white/60 font-caslon-regular text-sm mt-2">
                  {formatTime(recordingTime)}
                </p>
              </motion.div>

              {/* Audio Visualizer */}
              <div className="mb-6">
                <AudioVisualizer audioData={audioData} isRecording={isRecording} />
              </div>

              {/* Transcript */}
              {transcript && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-white/10 rounded-xl"
                >
                  <p className="text-white/90 font-caslon-regular text-sm">
                    "{transcript}"
                  </p>
                </motion.div>
              )}

              {/* Controls */}
              <div className="flex justify-center space-x-4">
                {!isRecording && !recordedBlob && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startRecording}
                    className="px-8 py-4 bg-gradient-to-r from-primary to-primary/80 text-white rounded-full font-caslon-medium text-lg btn-elegant"
                  >
                    Start Recording
                  </motion.button>
                )}

                {isRecording && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={stopRecording}
                    className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-caslon-medium text-lg btn-elegant"
                  >
                    Stop Recording
                  </motion.button>
                )}

                {recordedBlob && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={sendVoiceMessage}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-caslon-medium btn-elegant"
                    >
                      Send
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={cancelRecording}
                      className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full font-caslon-medium btn-elegant"
                    >
                      Cancel
                    </motion.button>
                  </>
                )}
              </div>

              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white/80 hover:bg-white/30 transition-colors"
              >
                ×
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VoiceAmbienceRecorder;
