
import React from 'react';
import { PenSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileActionsProps {
  isCurrentUser?: boolean;
  onEditProfile?: () => void;
  onFollow?: () => void;
  onMessage?: () => void;
  className?: string;
  editProfileButton?: React.ReactNode;
}

const ProfileActions = ({
  isCurrentUser = true,
  onEditProfile,
  onFollow,
  onMessage,
  className,
  editProfileButton
}: ProfileActionsProps) => {
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
        <div className="flex gap-4 mb-6">
          <button 
            onClick={onFollow}
            className="flex-1 bg-nuumi-pink text-white rounded-full py-2.5 font-medium transition-all hover:bg-nuumi-pink/90"
          >
            Follow
          </button>
          
          <button 
            onClick={onMessage}
            className="flex-1 bg-secondary text-foreground rounded-full py-2.5 font-medium transition-all hover:bg-secondary/80"
          >
            Message
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileActions;
