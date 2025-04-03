
import React, { useState, useEffect } from 'react';
import StoryCircle from './StoryCircle';
import StoryViewer from './StoryViewer';
import StoryCreation from './StoryCreation';
import { StoryItem } from './Story';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface StoriesRowProps {
  stories: StoryItem[];
  isLoading?: boolean;
  className?: string;
  currentUserId?: string | null;
}

const StoriesRow: React.FC<StoriesRowProps> = ({
  stories,
  isLoading = false,
  className,
  currentUserId
}) => {
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();
  
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

  // Open story creation
  const handleCreateStory = () => {
    setIsCreating(true);
  };

  // Handle story creation success
  const handleStoryCreationSuccess = () => {
    // Invalidate stories query to fetch the latest stories
    queryClient.invalidateQueries({ queryKey: ['stories'] });
  };

  return (
    <div className={cn("relative", className)}>
      <div className="overflow-x-auto pb-1 hide-scrollbar">
        <div className="flex gap-3 px-3 py-2">
          {/* "Add Story" circle for logged in users */}
          {currentUserId && (
            <div 
              className="flex flex-col items-center cursor-pointer max-w-[4rem]"
              onClick={handleCreateStory}
            >
              <div className="rounded-full bg-muted flex items-center justify-center w-14 h-14 border-2 border-dashed border-primary/50">
                <PlusCircle className="text-primary" size={24} />
              </div>
              <span className="text-xs text-center text-foreground truncate w-14 mt-1">
                Add Story
              </span>
            </div>
          )}

          {isLoading ? (
            // Skeleton loading state
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center max-w-[4rem]">
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="h-3 w-10 mt-1" />
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

      {/* Story Creation */}
      {isCreating && (
        <StoryCreation
          onClose={() => setIsCreating(false)}
          onSuccess={handleStoryCreationSuccess}
        />
      )}
    </div>
  );
};

export default StoriesRow;
