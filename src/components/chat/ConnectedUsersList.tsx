
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Avatar from '../shared/Avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface ConnectedUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  lastSeen: string | null;
}

interface ConnectedUsersListProps {
  currentUserId?: string;
}

const ConnectedUsersList: React.FC<ConnectedUsersListProps> = ({ currentUserId }) => {
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchConnectedUsers = async () => {
      if (!currentUserId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Get users that the current user is following
        const { data: followingData, error: followingError } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', currentUserId);
          
        if (followingError) throw followingError;
        
        if (!followingData || followingData.length === 0) {
          setConnectedUsers([]);
          setLoading(false);
          return;
        }
        
        // Get profile details for each connected user
        const followingIds = followingData.map(item => item.following_id);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, updated_at')
          .in('id', followingIds);
          
        if (profilesError) throw profilesError;
        
        if (profilesData) {
          const formattedUsers: ConnectedUser[] = profilesData.map(profile => ({
            id: profile.id,
            username: profile.username || 'anonymous',
            displayName: profile.display_name || profile.username || 'Anonymous',
            avatarUrl: profile.avatar_url,
            lastSeen: profile.updated_at
          }));
          
          setConnectedUsers(formattedUsers);
        }
      } catch (error) {
        console.error('Error fetching connected users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConnectedUsers();
  }, [currentUserId]);
  
  const startChat = async (userId: string) => {
    if (!currentUserId) {
      navigate('/auth');
      return;
    }
    
    try {
      // Check if conversation already exists
      const { data: existingParticipants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId);
        
      if (participantsError) throw participantsError;
      
      if (existingParticipants && existingParticipants.length > 0) {
        const conversationIds = existingParticipants.map(p => p.conversation_id);
        
        const { data: otherParticipants, error: otherParticipantsError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .in('conversation_id', conversationIds)
          .eq('user_id', userId);
          
        if (otherParticipantsError) throw otherParticipantsError;
        
        if (otherParticipants && otherParticipants.length > 0) {
          // Conversation exists, navigate to it
          navigate(`/chats/${otherParticipants[0].conversation_id}`);
          return;
        }
      }
      
      // Create new conversation
      const { data: newConversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({})
        .select('id')
        .single();
        
      if (conversationError) throw conversationError;
      
      // Add participants
      await supabase.from('conversation_participants').insert([
        { conversation_id: newConversation.id, user_id: currentUserId },
        { conversation_id: newConversation.id, user_id: userId }
      ]);
      
      // Navigate to new conversation
      navigate(`/chats/${newConversation.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="mt-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (!currentUserId) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">Sign in to see your connections</p>
      </div>
    );
  }
  
  if (connectedUsers.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">You haven't connected with anyone yet</p>
        <button 
          className="mt-2 text-nuumi-pink font-medium"
          onClick={() => navigate('/feed')}
        >
          Explore and connect with others
        </button>
      </div>
    );
  }
  
  return (
    <div className="divide-y divide-border">
      {connectedUsers.map(user => (
        <div 
          key={user.id} 
          className="flex items-center py-3 px-4 hover:bg-secondary/30 transition-colors cursor-pointer"
          onClick={() => startChat(user.id)}
        >
          <Avatar 
            src={user.avatarUrl || undefined} 
            alt={user.displayName}
            status="online" 
          />
          <div className="ml-3">
            <h4 className="font-medium">{user.displayName}</h4>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConnectedUsersList;
