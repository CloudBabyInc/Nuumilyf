
import React, { useState, useEffect } from 'react';
import { PenSquare, UserPlus, MessageCircle, Clock, Check, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useFriendRequests, useFriendshipStatus } from '@/hooks/useFriendRequests';

interface ProfileActionsProps {
  isCurrentUser?: boolean;
  onEditProfile?: () => void;
  onMessage?: () => void;
  userId?: string;
  className?: string;
  editProfileButton?: React.ReactNode;
}

const ProfileActions = ({
  isCurrentUser = true,
  onEditProfile,
  onMessage,
  className,
  editProfileButton,
  userId
}: ProfileActionsProps) => {
  const navigate = useNavigate();
  const { sendFriendRequest, acceptFriendRequest, rejectFriendRequest, loadingStates } = useFriendRequests();
  const { data: friendshipStatus, isLoading: statusLoading } = useFriendshipStatus(userId);

  const handleFriendAction = async () => {
    if (!userId) {
      toast.error('User ID not found');
      return;
    }

    if (!friendshipStatus) return;

    try {
      switch (friendshipStatus.status) {
        case 'none':
          await sendFriendRequest(userId);
          break;
        case 'request_received':
          if (friendshipStatus.request_id) {
            await acceptFriendRequest(friendshipStatus.request_id);
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error handling friend action:', error);
    }
  };

  const handleRejectRequest = async () => {
    if (!friendshipStatus?.request_id) return;

    try {
      await rejectFriendRequest(friendshipStatus.request_id);
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const handleMessageClick = () => {
    if (onMessage) {
      onMessage();
    } else if (userId) {
      // Use the standardized route for chat initiation
      navigate(`/chats/user/${userId}`);
    }
  };

  return (
    <div className={cn("px-4 animate-fade-in animate-delay-300", className)}>
      {isCurrentUser ? (
        editProfileButton ? (
          <div>{editProfileButton}</div>
        ) : (
          <button
            onClick={onEditProfile}
            className="w-full bg-nuumi-pink text-white rounded-full py-2.5 font-medium flex items-center justify-center transition-all hover:bg-nuumi-pink/90 mb-6"
          >
            <PenSquare size={18} className="mr-2" />
            Edit Profile
          </button>
        )
      ) : (
        <div className="space-y-3 mb-6">
          {statusLoading ? (
            <div className="flex gap-4">
              <div className="flex-1 h-10 bg-muted rounded-full animate-pulse" />
              <div className="flex-1 h-10 bg-muted rounded-full animate-pulse" />
            </div>
          ) : friendshipStatus?.status === 'friends' ? (
            // Already friends
            <div className="flex gap-4">
              <button
                className="flex-1 border border-nuumi-pink text-nuumi-pink rounded-full py-2.5 font-medium transition-all hover:bg-nuumi-pink/10 flex items-center justify-center"
                disabled
              >
                <UserCheck size={18} className="mr-2" />
                Friends
              </button>
              <button
                onClick={handleMessageClick}
                className="flex-1 bg-nuumi-pink text-white rounded-full py-2.5 font-medium transition-all hover:bg-nuumi-pink/90 flex items-center justify-center"
              >
                <MessageCircle size={18} className="mr-2" />
                Message
              </button>
            </div>
          ) : friendshipStatus?.status === 'request_sent' ? (
            // Request sent
            <button
              className="w-full border border-muted-foreground text-muted-foreground rounded-full py-2.5 font-medium flex items-center justify-center"
              disabled
            >
              <Clock size={18} className="mr-2" />
              Request Sent
            </button>
          ) : friendshipStatus?.status === 'request_received' ? (
            // Request received - show accept/reject buttons
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={handleFriendAction}
                  disabled={loadingStates[friendshipStatus.request_id || '']}
                  className="flex-1 bg-nuumi-pink text-white rounded-full py-2.5 font-medium transition-all hover:bg-nuumi-pink/90 flex items-center justify-center"
                >
                  {loadingStates[friendshipStatus.request_id || ''] ? (
                    <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={18} className="mr-2" />
                      Accept Request
                    </>
                  )}
                </button>
                <button
                  onClick={handleRejectRequest}
                  disabled={loadingStates[friendshipStatus.request_id || '']}
                  className="flex-1 border border-muted-foreground text-muted-foreground rounded-full py-2.5 font-medium transition-all hover:bg-muted/10 flex items-center justify-center"
                >
                  Decline
                </button>
              </div>
            </div>
          ) : (
            // No relationship - show send request button
            <div className="flex gap-4">
              <button
                onClick={handleFriendAction}
                disabled={loadingStates[userId || '']}
                className="flex-1 bg-nuumi-pink text-white rounded-full py-2.5 font-medium transition-all hover:bg-nuumi-pink/90 flex items-center justify-center"
              >
                {loadingStates[userId || ''] ? (
                  <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus size={18} className="mr-2" />
                    Send Request
                  </>
                )}
              </button>
              <button
                onClick={handleMessageClick}
                disabled
                title="Connect first to send messages"
                className="flex-1 bg-muted text-muted-foreground rounded-full py-2.5 font-medium flex items-center justify-center cursor-not-allowed"
              >
                <MessageCircle size={18} className="mr-2" />
                Message
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileActions;
