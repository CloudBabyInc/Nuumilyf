import React from 'react';
import { cn } from '@/lib/utils';
import { usePresenceContext } from '@/components/providers/PresenceProvider';

interface OnlineStatusIndicatorProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const OnlineStatusIndicator: React.FC<OnlineStatusIndicatorProps> = ({
  userId,
  size = 'md',
  className
}) => {
  const { getUserStatus } = usePresenceContext();

  const status = getUserStatus(userId);

  // Only show indicator for online users
  if (status !== 'online') {
    return null;
  }

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  return (
    <div
      className={cn(
        'rounded-full border-2 border-background bg-green-500 shadow-lg',
        sizeClasses[size],
        className
      )}
      title="Online"
    />
  );
};

export default OnlineStatusIndicator;
