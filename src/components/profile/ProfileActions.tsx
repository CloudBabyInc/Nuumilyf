
import React, { useState, useEffect } from 'react';
import { PenSquare, Link as LinkIcon, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProfileActionsProps {
  isCurrentUser?: boolean;
  onEditProfile?: () => void;
  onFollow?: () => void;
  onMessage?: () => void;
  isFollowing?: boolean;
  followersCount?: number;
  userId?: string;
  className?: string;
  editProfileButton?: React.ReactNode;
}

const ProfileActions = ({
  isCurrentUser = true,
  onEditProfile,
  onFollow,
  onMessage,
  isFollowing = false,
  className,
  editProfileButton,
  userId
}: ProfileActionsProps) => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(isFollowing);
  
  // Update the connected state when the isFollowing prop changes
  useEffect(() => {
    setIsConnected(isFollowing);
  }, [isFollowing]);
  
  const handleConnectClick = async () => {
    if (!userId) return;
    
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      toast.error('Please sign in to connect with other users');
      navigate('/auth');
      return;
    }
    
    setIsConnecting(true);
    
    try {
      if (isConnected) {
        // Disconnect logic
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', session.session.user.id)
          .eq('following_id', userId);
          
        if (error) throw error;
        
        setIsConnected(false);
        toast.success('Successfully disconnected');
        
        if (onFollow) onFollow();
      } else {
        // Connect logic - first check if the connection already exists
        const { data: existingFollow, error: checkError } = await supabase
          .from('followers')
          .select('id')
          .eq('follower_id', session.session.user.id)
          .eq('following_id', userId)
          .maybeSingle();
          
        if (checkError) throw checkError;
        
        // Only insert if no existing connection
        if (!existingFollow) {
          const { error } = await supabase
            .from('followers')
            .insert({
              follower_id: session.session.user.id,
              following_id: userId
            });
            
          if (error) throw error;
        }
        
        setIsConnected(true);
        toast.success('Successfully connected');
        
        if (onFollow) onFollow();
      }
    } catch (error) {
      console.error('Error toggling connection:', error);
      toast.error('Failed to update connection status');
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleMessageClick = () => {
    if (onMessage) {
      onMessage();
    } else if (userId) {
      navigate(`/chats/${userId}`);
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
        <div className="flex gap-4 mb-6">
          <button 
            onClick={handleConnectClick}
            disabled={isConnecting}
            className={cn(
              "flex-1 rounded-full py-2.5 font-medium transition-all flex items-center justify-center",
              isConnected 
                ? "border border-nuumi-pink text-nuumi-pink hover:bg-nuumi-pink/10" 
                : "bg-nuumi-pink text-white hover:bg-nuumi-pink/90"
            )}
          >
            <LinkIcon size={18} className="mr-2" />
            {isConnecting ? 'Processing...' : isConnected ? 'Connected' : 'Connect'}
          </button>
          
          <button 
            onClick={handleMessageClick}
            className="flex-1 bg-secondary text-foreground rounded-full py-2.5 font-medium transition-all hover:bg-secondary/80 flex items-center justify-center"
          >
            <MessageCircle size={18} className="mr-2" />
            Message
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileActions;
