
import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Image } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import { cn } from '@/lib/utils';

export interface StoryItem {
  id: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  imageUrl: string;
  caption?: string;
  createdAt: string;
}

interface StoryProps {
  story: StoryItem;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

const Story: React.FC<StoryProps> = ({
  story,
  onClose,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false
}) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={onClose}
          className="text-white bg-black/40 p-2 rounded-full hover:bg-black/60 transition-colors"
          aria-label="Close story"
        >
          <X size={24} />
        </button>
      </div>
      
      <div className="relative w-full h-full max-w-md max-h-[80vh] mx-auto">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
          <div className="flex items-center space-x-3">
            <Avatar 
              src={story.user.avatar} 
              alt={story.user.name}
              size="md"
            />
            <div>
              <h4 className="text-white font-semibold">{story.user.name}</h4>
              <p className="text-white/70 text-sm">{new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="h-full w-full flex items-center justify-center relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Image size={48} className="text-white/50 animate-pulse" />
            </div>
          )}
          
          <img 
            src={story.imageUrl} 
            alt={story.caption || "Story image"}
            className={cn(
              "w-full h-full object-contain",
              isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-300"
            )}
            onLoad={handleImageLoad}
          />
          
          {story.caption && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-center">{story.caption}</p>
            </div>
          )}
        </div>
        
        {/* Navigation buttons */}
        {hasPrevious && (
          <button 
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full hover:bg-black/60 transition-colors text-white"
            onClick={onPrevious}
            aria-label="Previous story"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        
        {hasNext && (
          <button 
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full hover:bg-black/60 transition-colors text-white"
            onClick={onNext}
            aria-label="Next story"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Story;
