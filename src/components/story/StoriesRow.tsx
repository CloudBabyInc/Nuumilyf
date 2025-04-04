
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
  
  // Check if current user has stories
  const currentUserHasStories = currentUserId && storiesByUser[currentUserId]?.length > 0;
  
  // Get current user story if it exists
  const currentUserStory = currentUserId && currentUserHasStories
    ? storiesByUser[currentUserId].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]
    : null;
  
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
    setIsCreating(false);
  };

  // Set up real-time subscription for stories
  useEffect(() => {
    // Subscribe to real-time updates for stories
    const channel = supabase
      .channel('public:stories')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'stories',
      }, () => {
        // When a new story is added, invalidate the stories query
        queryClient.invalidateQueries({ queryKey: ['stories'] });
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'stories',
      }, () => {
        // When a story is deleted (e.g. expires), invalidate the stories query
        queryClient.invalidateQueries({ queryKey: ['stories'] });
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <div className={cn("relative", className)}>
      <div className="overflow-x-auto pb-1 hide-scrollbar">
        <div className="flex gap-2 px-3 py-2">
          {/* Current user's story or Add Story button first */}
          {currentUserId && (
            currentUserHasStories ? (
              <StoryCircle
                key={`user-story-${currentUserStory?.id}`}
                name="Your Story"
                avatar={currentUserStory?.user.avatar}
                isViewed={false}
                onClick={() => {
                  // Find the index of current user's story in the latestUserStories array
                  const currentUserIndex = latestUserStories.findIndex(
                    story => story.user.id === currentUserId
                  );
                  if (currentUserIndex !== -1) {
                    handleStoryClick(currentUserId, currentUserIndex);
                  }
                }}
              />
            ) : (
              <StoryCircle 
                name="Add Story" 
                onClick={handleCreateStory}
                isViewed={true}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlusCircle className="text-primary" size={16} />
                </div>
              </StoryCircle>
            )
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
            // Show other users' stories (excluding current user's story)
            latestUserStories
              .filter(story => story.user.id !== currentUserId)
              .map((story, index) => (
                <StoryCircle
                  key={`user-story-${story.id}`}
                  name={story.user.name}
                  avatar={story.user.avatar}
                  isViewed={false} // We'd track this state in a real app
                  onClick={() => {
                    // We need to adjust the index since we've filtered out the current user
                    const adjustedIndex = latestUserStories.findIndex(s => s.id === story.id);
                    handleStoryClick(story.user.id, adjustedIndex);
                  }}
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
