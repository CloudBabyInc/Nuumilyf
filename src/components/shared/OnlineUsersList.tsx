import React, { useState, useEffect } from 'react';
import { usePresenceContext } from '@/components/providers/PresenceProvider';
import Avatar from './Avatar';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Users, Wifi, WifiOff } from 'lucide-react';

interface OnlineUsersListProps {
  className?: string;
  showCount?: boolean;
  maxVisible?: number;
}

interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

const OnlineUsersList: React.FC<OnlineUsersListProps> = ({
  className,
  showCount = true,
  maxVisible = 5
}) => {
  const { presenceState, getOnlineUsersCount, isConnected } = usePresenceContext();
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user profiles for online users
  useEffect(() => {
    const fetchUserProfiles = async () => {
      const onlineUserIds = Object.keys(presenceState).filter(
        userId => presenceState[userId].status === 'online'
      );

      if (onlineUserIds.length === 0) {
        setUserProfiles([]);
        return;
      }

      setLoading(true);
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', onlineUserIds);

        if (error) throw error;
        setUserProfiles(profiles || []);
      } catch (error) {
        console.error('Error fetching user profiles:', error);
        setUserProfiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfiles();
  }, [presenceState]);

  const onlineCount = getOnlineUsersCount();
  const visibleUsers = userProfiles.slice(0, maxVisible);
  const remainingCount = Math.max(0, onlineCount - maxVisible);

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="animate-pulse flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Connection Status Indicator */}
      <div className="flex items-center gap-1">
        {isConnected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
      </div>

      {/* Online Users Avatars */}
      {visibleUsers.length > 0 && (
        <div className="flex items-center -space-x-2">
          {visibleUsers.map((user) => (
            <div key={user.id} className="relative">
              <Avatar
                src={user.avatar_url || undefined}
                alt={user.full_name || user.username || 'User'}
                size="sm"
                userId={user.id}
                showPresence={true}
                className="border-2 border-background hover:z-10 transition-transform hover:scale-110"
              />
            </div>
          ))}
          
          {/* Show remaining count if there are more users */}
          {remainingCount > 0 && (
            <div className="flex items-center justify-center h-8 w-8 bg-gray-100 border-2 border-background rounded-full text-xs font-medium text-gray-600">
              +{remainingCount}
            </div>
          )}
        </div>
      )}

      {/* Online Count */}
      {showCount && (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span className="font-medium">
            {onlineCount} online
          </span>
        </div>
      )}

      {/* No users online message */}
      {onlineCount === 0 && (
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Users className="h-4 w-4" />
          <span>No users online</span>
        </div>
      )}
    </div>
  );
};

export default OnlineUsersList;
