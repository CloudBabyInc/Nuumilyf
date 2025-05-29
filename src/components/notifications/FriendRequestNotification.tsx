import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Avatar from '@/components/shared/Avatar';
import { useFriendRequests } from '@/hooks/useFriendRequests';
import { formatDistanceToNow } from 'date-fns';

interface FriendRequestNotificationProps {
  notification: {
    id: string;
    entity_id: string;
    created_at: string;
    actor?: {
      username: string;
      full_name: string;
      avatar_url: string;
    };
  };
  onMarkAsRead?: (notificationId: string) => void;
}

const FriendRequestNotification: React.FC<FriendRequestNotificationProps> = ({
  notification,
  onMarkAsRead
}) => {
  const { acceptFriendRequest, rejectFriendRequest, loadingStates } = useFriendRequests();

  const handleAccept = async () => {
    try {
      await acceptFriendRequest(notification.entity_id);
      if (onMarkAsRead) {
        onMarkAsRead(notification.id);
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleReject = async () => {
    try {
      await rejectFriendRequest(notification.entity_id);
      if (onMarkAsRead) {
        onMarkAsRead(notification.id);
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const isLoading = loadingStates[notification.entity_id];
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start space-x-3 p-4 bg-card rounded-lg border hover:bg-accent/50 transition-colors"
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar
          src={notification.actor?.avatar_url}
          alt={notification.actor?.full_name || notification.actor?.username || 'User'}
          size="md"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              <span className="font-semibold">
                {notification.actor?.full_name || notification.actor?.username || 'Someone'}
              </span>
              {' '}sent you a friend request
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {timeAgo}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 mt-3">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={isLoading}
            className="h-8 px-3 text-xs"
          >
            {isLoading ? (
              <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check size={12} className="mr-1" />
                Accept
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleReject}
            disabled={isLoading}
            className="h-8 px-3 text-xs"
          >
            {isLoading ? (
              <div className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />
            ) : (
              <>
                <X size={12} className="mr-1" />
                Decline
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default FriendRequestNotification;
