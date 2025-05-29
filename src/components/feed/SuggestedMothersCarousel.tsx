import React from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Avatar from '@/components/shared/Avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import TabScroller from '@/components/ui/tab-scroller';
import { cn } from '@/lib/utils';
import { useFriendRequests } from '@/hooks/useFriendRequests';

interface SuggestedMother {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  mutual_connections: number;
  friendship_status?: 'none' | 'friends' | 'request_sent' | 'request_received';
}

interface SuggestedMothersCarouselProps {
  currentUserId?: string;
  className?: string;
  onDismiss?: () => void;
}

const SuggestedMothersCarousel: React.FC<SuggestedMothersCarouselProps> = ({
  currentUserId,
  className,
  onDismiss
}) => {
  const navigate = useNavigate();
  const { sendFriendRequest, loadingStates } = useFriendRequests();

  // Fetch suggested mothers
  const { data: suggestedMothers, isLoading } = useQuery({
    queryKey: ['suggested-mothers', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return [];

      // Get users that are already friends
      const { data: friendsData } = await supabase
        .from('friendships')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);

      const friendIds = friendsData?.map(f =>
        f.user1_id === currentUserId ? f.user2_id : f.user1_id
      ) || [];

      // Get users with pending friend requests (sent or received)
      const { data: requestsData } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .eq('status', 'pending');

      const requestUserIds = requestsData?.map(r =>
        r.sender_id === currentUserId ? r.receiver_id : r.sender_id
      ) || [];

      // Combine excluded user IDs
      const excludedIds = [...friendIds, ...requestUserIds, currentUserId];

      // Get suggested users (excluding current user, friends, and pending requests)
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          username,
          avatar_url,
          bio,
          location
        `)
        .limit(10);

      if (excludedIds.length > 0) {
        query = query.not('id', 'in', `(${excludedIds.join(',')})`);
      }

      const { data: profiles, error } = await query;

      if (error) {
        console.error('Error fetching suggested mothers:', error);
        throw error;
      }

      // Calculate mutual connections for each suggested user
      const suggestedWithMutuals = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get mutual friends count
          const { count: mutualCount } = await supabase
            .from('friendships')
            .select('*', { count: 'exact', head: true })
            .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
            .or(`user1_id.in.(${friendIds.join(',')}),user2_id.in.(${friendIds.join(',')})`);

          return {
            ...profile,
            mutual_connections: mutualCount || 0,
            friendship_status: 'none' as const
          };
        })
      );

      // Sort by mutual connections and randomize
      return suggestedWithMutuals
        .sort((a, b) => b.mutual_connections - a.mutual_connections)
        .slice(0, 8);
    },
    enabled: !!currentUserId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const handleSendRequest = async (userId: string) => {
    if (!currentUserId) {
      toast.error('Please sign in to send friend requests');
      return;
    }

    await sendFriendRequest(userId);
  };

  const handleMessage = (userId: string) => {
    if (!currentUserId) {
      toast.error('Please sign in to send messages');
      return;
    }
    navigate(`/chats/user/${userId}`);
  };

  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  if (!currentUserId || !suggestedMothers || suggestedMothers.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={cn("bg-card rounded-xl p-4 mb-3", className)}>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-5" />
        </div>
        <TabScroller className="gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-32">
              <div className="bg-background rounded-lg p-3 border">
                <Skeleton className="h-16 w-16 rounded-full mx-auto mb-2" />
                <Skeleton className="h-4 w-20 mx-auto mb-1" />
                <Skeleton className="h-3 w-16 mx-auto mb-3" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </TabScroller>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-card rounded-xl p-4 mb-3", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Suggested for you</h3>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Carousel */}
      <TabScroller className="gap-3">
        {suggestedMothers.map((mother) => (
          <motion.div
            key={mother.id}
            className="flex-shrink-0 w-32"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-background rounded-lg p-3 border hover:border-nuumi-pink/30 transition-colors">
              {/* Avatar */}
              <div className="text-center mb-2">
                <Avatar
                  src={mother.avatar_url}
                  alt={mother.full_name || mother.username}
                  size="lg"
                  onClick={() => handleProfileClick(mother.id)}
                  className="cursor-pointer mx-auto"
                />
              </div>

              {/* Name */}
              <div className="text-center mb-1">
                <h4
                  className="font-medium text-sm text-foreground cursor-pointer hover:underline line-clamp-1"
                  onClick={() => handleProfileClick(mother.id)}
                >
                  {mother.full_name || mother.username}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  @{mother.username}
                </p>
              </div>

              {/* Mutual connections */}
              {mother.mutual_connections > 0 && (
                <p className="text-xs text-muted-foreground text-center mb-3">
                  {mother.mutual_connections} mutual connection{mother.mutual_connections !== 1 ? 's' : ''}
                </p>
              )}

              {/* Action buttons */}
              <div className="space-y-2">
                <Button
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={() => handleSendRequest(mother.id)}
                  disabled={loadingStates[mother.id]}
                >
                  {loadingStates[mother.id] ? (
                    <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus size={12} className="mr-1" />
                      Send Request
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={() => handleMessage(mother.id)}
                  disabled
                  title="Connect first to send messages"
                >
                  <MessageCircle size={12} className="mr-1" />
                  Message
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </TabScroller>
    </motion.div>
  );
};

export default SuggestedMothersCarousel;
