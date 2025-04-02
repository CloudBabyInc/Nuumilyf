
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: 'like' | 'comment' | 'follow' | 'message';
  entity_id: string | null;
  entity_type: string | null;
  read: boolean;
  content: string | null;
  created_at: string;
  actor?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      // Fetch notifications with actor profile information
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('user_id', session.session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data as Notification[]);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to update notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', session.session.user.id)
        .eq('read', false);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      toast.error('Failed to update notifications');
    }
  };

  // Subscribe to realtime notifications when the component mounts
  useEffect(() => {
    fetchNotifications();

    // Set up realtime subscription
    const setupRealtimeSubscription = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const channel = supabase
        .channel('public:notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.session.user.id}`,
        }, async (payload) => {
          // When a new notification is inserted, fetch the actor data
          const { data: actorData } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('id', payload.new.actor_id)
            .single();

          // Add the new notification to state with actor data
          const newNotification = {
            ...payload.new,
            actor: actorData || null
          } as Notification;
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for the new notification
          toast.success('New notification', {
            description: getNotificationText(newNotification)
          });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtimeSubscription();
    return () => {
      cleanup.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  };
}

// Helper function to generate notification text based on type
export function getNotificationText(notification: Notification): string {
  const actorName = notification.actor?.display_name || notification.actor?.username || 'Someone';
  
  switch (notification.type) {
    case 'like':
      return `${actorName} liked your post`;
    case 'comment':
      return `${actorName} commented on your post`;
    case 'follow':
      return `${actorName} started following you`;
    case 'message':
      return `${actorName} sent you a message`;
    default:
      return 'You have a new notification';
  }
}

// Helper function to handle navigation based on notification type
export function handleNotificationClick(notification: Notification, navigate: (path: string) => void) {
  if (!notification.entity_id) return;

  switch (notification.type) {
    case 'like':
    case 'comment':
      if (notification.entity_type === 'post') {
        navigate(`/post/${notification.entity_id}`);
      }
      break;
    case 'follow':
      navigate(`/profile/${notification.actor_id}`);
      break;
    case 'message':
      if (notification.entity_type === 'conversation') {
        navigate(`/chats/${notification.entity_id}`);
      }
      break;
    default:
      break;
  }
}
