
import React from 'react';
import Avatar from '@/components/shared/Avatar';
import { cn } from '@/lib/utils';

interface StoryCircleProps {
  name: string;
  avatar?: string;
  isViewed?: boolean;
  onClick?: () => void;
  className?: string;
}

const StoryCircle: React.FC<StoryCircleProps> = ({
  name,
  avatar,
  isViewed = false,
  onClick,
  className
}) => {
  return (
    <div className={cn("flex flex-col items-center space-y-1 max-w-[4rem]", className)}>
      <button
        onClick={onClick}
        className={cn(
          "rounded-full p-[2px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-nuumi-pink",
          isViewed ? "bg-muted" : "bg-gradient-to-br from-nuumi-pink to-pink-400"
        )}
      >
        <Avatar
          src={avatar}
          alt={name}
          size="md"
          className={cn(
            "border-2 border-background", 
            isViewed ? "opacity-70" : "opacity-100"
          )}
        />
      </button>
      <span className="text-xs text-center text-foreground truncate w-14">
        {name}
      </span>
    </div>
  );
};

export default StoryCircle;
