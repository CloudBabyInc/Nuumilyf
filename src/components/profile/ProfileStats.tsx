
import React from 'react';
import { cn } from '@/lib/utils';

interface ProfileStatsProps {
  posts: number;
  followers: number;
  following: number;
  className?: string;
}

const ProfileStats = ({ posts, followers, following, className }: ProfileStatsProps) => {
  return (
    <div className={cn("flex justify-center items-center gap-12 mb-6 animate-fade-in animate-delay-100", className)}>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold">{posts}</span>
        <span className="text-sm text-muted-foreground">Posts</span>
      </div>
      
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold">{followers}</span>
        <span className="text-sm text-muted-foreground">Followers</span>
      </div>
      
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold">{following}</span>
        <span className="text-sm text-muted-foreground">Following</span>
      </div>
    </div>
  );
};

export default ProfileStats;
