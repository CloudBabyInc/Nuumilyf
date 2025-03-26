
import React, { useState } from 'react';
import StoryCircle from './StoryCircle';
import StoryViewer from './StoryViewer';
import { StoryItem } from './Story';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoriesRowProps {
  stories: StoryItem[];
  isLoading?: boolean;
  className?: string;
}

const StoriesRow: React.FC<StoriesRowProps> = ({
  stories,
  isLoading = false,
  className
}) => {
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  
  // Group stories by user
  const storiesByUser = stories.reduce<Record<string, StoryItem[]>>((acc, story) => {
    if (!acc[story.user.id]) {
      acc[story.user.id] = [];
    }
    acc[story.user.id].push(story);
    return acc;
  }, {});
  
  // Get latest story for each user
  const latestUserStories = Object.values(storiesByUser).map(userStories => {
    // Sort by date and get the latest
    return userStories.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  });
  
  // For the story viewer, we need to select stories from the same user
  const handleStoryClick = (userId: string, index: number) => {
    setActiveStoryIndex(index);
  };

  // Close story viewer
  const handleCloseStoryViewer = () => {
    setActiveStoryIndex(null);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="overflow-x-auto pb-2 hide-scrollbar">
        <div className="flex space-x-4 px-4">
          {isLoading ? (
            // Skeleton loading state
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center space-y-1">
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))
          ) : (
            latestUserStories.map((story, index) => (
              <StoryCircle
                key={story.id}
                name={story.user.name}
                avatar={story.user.avatar}
                isViewed={false} // We'd track this state in a real app
                onClick={() => handleStoryClick(story.user.id, index)}
              />
            ))
          )}
        </div>
      </div>
      
      {/* Story Viewer */}
      {activeStoryIndex !== null && latestUserStories[activeStoryIndex] && (
        <StoryViewer
          stories={storiesByUser[latestUserStories[activeStoryIndex].user.id] || []}
          initialStoryIndex={0}
          onClose={handleCloseStoryViewer}
        />
      )}
    </div>
  );
};

export default StoriesRow;
