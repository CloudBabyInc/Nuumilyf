import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface UserPresence {
  [userId: string]: {
    status: 'online' | 'away' | 'offline';
    lastSeen: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export function usePresence() {
  const [presenceState, setPresenceState] = useState<UserPresence>({});
  const [currentUserStatus, setCurrentUserStatus] = useState<'online' | 'away' | 'offline'>('offline');
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const awayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track user activity for away status
  const resetAwayTimer = () => {
    if (awayTimeoutRef.current) {
      clearTimeout(awayTimeoutRef.current);
    }

    if (currentUserStatus === 'away') {
      setCurrentUserStatus('online');
      updatePresence('online');
    }

    // Set user as away after 5 minutes of inactivity
    awayTimeoutRef.current = setTimeout(() => {
      setCurrentUserStatus('away');
      updatePresence('away');
    }, 5 * 60 * 1000); // 5 minutes
  };

  // Update presence in database
  const updatePresence = async (status: 'online' | 'away' | 'offline') => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      await supabase.rpc('update_user_presence', {
        user_uuid: session.user.id,
        new_status: status
      });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  // Fetch all presence data
  const fetchPresenceData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_online_users');
      if (error) throw error;

      const newPresenceState: UserPresence = {};
      data?.forEach((user: any) => {
        newPresenceState[user.user_id] = {
          status: user.status,
          lastSeen: user.last_seen,
          username: user.username,
          full_name: user.full_name,
          avatar_url: user.avatar_url
        };
      });

      setPresenceState(newPresenceState);
    } catch (error) {
      console.error('Error fetching presence data:', error);
    }
  };

  // Initialize presence system
  const initializePresence = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      // Set up realtime subscription for presence changes
      const channel = supabase
        .channel('user_presence_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_presence'
          },
          (payload) => {
            console.log('Presence change:', payload);
            // Refetch presence data when changes occur
            fetchPresenceData();
          }
        )
        .subscribe();

      channelRef.current = channel;

      // Set initial status and fetch data
      setIsConnected(true);
      setCurrentUserStatus('online');
      await updatePresence('online');
      await fetchPresenceData();

      // Set up heartbeat to maintain presence
      heartbeatRef.current = setInterval(() => {
        updatePresence(currentUserStatus);
      }, 30000); // Update every 30 seconds

      // Set up activity listeners for away status
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      events.forEach(event => {
        document.addEventListener(event, resetAwayTimer, true);
      });

      // Start the away timer
      resetAwayTimer();

    } catch (error) {
      console.error('Error initializing presence:', error);
    }
  };

  // Cleanup presence
  const cleanupPresence = async () => {
    await updatePresence('offline');

    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    if (awayTimeoutRef.current) {
      clearTimeout(awayTimeoutRef.current);
      awayTimeoutRef.current = null;
    }

    // Remove activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.removeEventListener(event, resetAwayTimer, true);
    });

    setIsConnected(false);
    setCurrentUserStatus('offline');
  };

  // Get user status
  const getUserStatus = (userId: string): 'online' | 'away' | 'offline' => {
    return presenceState[userId]?.status || 'offline';
  };

  // Get user last seen
  const getUserLastSeen = (userId: string): string | null => {
    return presenceState[userId]?.lastSeen || null;
  };

  // Get online users count (for internal use only)
  const getOnlineUsersCount = (): number => {
    return Object.values(presenceState).filter(user => user.status === 'online').length;
  };

  // Initialize on mount
  useEffect(() => {
    initializePresence();

    // Cleanup on unmount or when user signs out
    return () => {
      cleanupPresence();
    };
  }, []);

  // Handle auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        cleanupPresence();
      } else if (event === 'SIGNED_IN' && session) {
        initializePresence();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setCurrentUserStatus('away');
        updatePresence('away');
      } else {
        setCurrentUserStatus('online');
        updatePresence('online');
        resetAwayTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentUserStatus]);

  // Handle beforeunload to set offline status
  useEffect(() => {
    const handleBeforeUnload = () => {
      updatePresence('offline');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    presenceState,
    currentUserStatus,
    isConnected,
    getUserStatus,
    getUserLastSeen,
    getOnlineUsersCount,
    updatePresence
  };
}
