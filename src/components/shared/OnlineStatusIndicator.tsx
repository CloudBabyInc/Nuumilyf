import React from 'react';
import { cn } from '@/lib/utils';
import { usePresenceContext } from '@/components/providers/PresenceProvider';
import { formatDistanceToNow } from 'date-fns';

interface OnlineStatusIndicatorProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const OnlineStatusIndicator: React.FC<OnlineStatusIndicatorProps> = ({
  userId,
  size = 'md',
  showText = false,
  className
}) => {
  const { getUserStatus, getUserLastSeen } = usePresenceContext();
  
  const status = getUserStatus(userId);
  const lastSeen = getUserLastSeen(userId);

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  const statusClasses = {
    online: 'bg-green-500 shadow-green-500/50',
    away: 'bg-yellow-500 shadow-yellow-500/50',
    offline: 'bg-gray-400 shadow-gray-400/50'
  };

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'offline':
        if (lastSeen) {
          try {
            return `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`;
          } catch {
            return 'Offline';
          }
        }
        return 'Offline';
      default:
        return 'Offline';
    }
  };

  if (showText) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div
          className={cn(
            'rounded-full border-2 border-background shadow-lg animate-pulse',
            sizeClasses[size],
            statusClasses[status],
            status === 'online' && 'animate-pulse'
          )}
        />
        <span className={cn(
          'text-sm',
          status === 'online' ? 'text-green-600' : 
          status === 'away' ? 'text-yellow-600' : 
          'text-gray-500'
        )}>
          {getStatusText()}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full border-2 border-background shadow-lg',
        sizeClasses[size],
        statusClasses[status],
        status === 'online' && 'animate-pulse',
        className
      )}
      title={getStatusText()}
    />
  );
};

export default OnlineStatusIndicator;
