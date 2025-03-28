
import React, { useState, useEffect } from 'react';
import Story, { StoryItem } from './Story';

interface StoryViewerProps {
  stories: StoryItem[];
  initialStoryIndex?: number;
  onClose: () => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  initialStoryIndex = 0,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [isPaused, setIsPaused] = useState(false);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < stories.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') { // Space bar to toggle pause
        setIsPaused(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, stories.length, onClose]);

  // Handle document visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  if (stories.length === 0) return null;

  const currentStory = stories[currentIndex];

  return (
    <Story
      story={currentStory}
      onClose={onClose}
      onNext={currentIndex < stories.length - 1 ? () => setCurrentIndex(prev => prev + 1) : undefined}
      onPrevious={currentIndex > 0 ? () => setCurrentIndex(prev => prev - 1) : undefined}
      hasNext={currentIndex < stories.length - 1}
      hasPrevious={currentIndex > 0}
    />
  );
};

export default StoryViewer;
