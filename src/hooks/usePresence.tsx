import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceState {
  user_id: string;
  username?: string;
  avatar_url?: string;
  online_at: string;
  status: 'online' | 'away' | 'offline';
}

export interface UserPresence {
  [userId: string]: {
    status: 'online' | 'away' | 'offline';
    lastSeen: string;
    username?: string;
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

  // Update presence in Supabase
  const updatePresence = async (status: 'online' | 'away' | 'offline') => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !channelRef.current) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', session.user.id)
        .single();

      const presenceData: PresenceState = {
        user_id: session.user.id,
        username: profile?.username || 'Anonymous',
        avatar_url: profile?.avatar_url || null,
        online_at: new Date().toISOString(),
        status
      };

      await channelRef.current.track(presenceData);
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  // Initialize presence system
  const initializePresence = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      // Create presence channel
      const channel = supabase.channel('online-users', {
        config: {
          presence: {
            key: session.user.id,
          },
        },
      });

      channelRef.current = channel;

      // Handle presence sync (when users join/leave)
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const newPresenceState: UserPresence = {};

        Object.entries(state).forEach(([userId, presences]) => {
          const presence = presences[0] as PresenceState;
          if (presence) {
            newPresenceState[userId] = {
              status: presence.status,
              lastSeen: presence.online_at,
              username: presence.username,
              avatar_url: presence.avatar_url
            };
          }
        });

        setPresenceState(newPresenceState);
      });

      // Handle user joining
      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const presence = newPresences[0] as PresenceState;
        if (presence) {
          setPresenceState(prev => ({
            ...prev,
            [key]: {
              status: presence.status,
              lastSeen: presence.online_at,
              username: presence.username,
              avatar_url: presence.avatar_url
            }
          }));
        }
      });

      // Handle user leaving
      channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const presence = leftPresences[0] as PresenceState;
        if (presence) {
          setPresenceState(prev => ({
            ...prev,
            [key]: {
              ...prev[key],
              status: 'offline',
              lastSeen: new Date().toISOString()
            }
          }));
        }
      });

      // Subscribe to the channel
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setCurrentUserStatus('online');
          await updatePresence('online');

          // Set up heartbeat to maintain presence
          heartbeatRef.current = setInterval(() => {
            updatePresence(currentUserStatus);
          }, 30000); // Update every 30 seconds
        }
      });

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
    if (channelRef.current) {
      await updatePresence('offline');
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

  // Get online users count
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
