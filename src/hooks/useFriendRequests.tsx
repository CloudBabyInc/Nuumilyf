import { useState, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  receiver?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

export interface FriendshipStatus {
  status: 'none' | 'friends' | 'request_sent' | 'request_received';
  request_id?: string;
}

export function useFriendRequests() {
  const queryClient = useQueryClient();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Get pending friend requests received by current user
  const { data: receivedRequests, isLoading: receivedLoading } = useQuery({
    queryKey: ['friend-requests-received'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return [];

      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          id,
          sender_id,
          receiver_id,
          status,
          created_at,
          updated_at,
          sender:profiles!friend_requests_sender_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('receiver_id', session.session.user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FriendRequest[];
    },
    staleTime: 30000,
  });

  // Get pending friend requests sent by current user
  const { data: sentRequests, isLoading: sentLoading } = useQuery({
    queryKey: ['friend-requests-sent'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return [];

      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          id,
          sender_id,
          receiver_id,
          status,
          created_at,
          updated_at,
          receiver:profiles!friend_requests_receiver_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('sender_id', session.session.user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FriendRequest[];
    },
    staleTime: 30000,
  });

  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async (receiverId: string) => {
      const { data, error } = await supabase.rpc('send_friend_request', {
        receiver_user_id: receiverId
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests-sent'] });
      queryClient.invalidateQueries({ queryKey: ['friendship-status'] });
      queryClient.invalidateQueries({ queryKey: ['suggested-mothers'] });
      toast.success('Friend request sent!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send friend request');
    },
  });

  // Accept friend request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.rpc('accept_friend_request', {
        request_id: requestId
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests-received'] });
      queryClient.invalidateQueries({ queryKey: ['friendship-status'] });
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
      toast.success('Friend request accepted!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to accept friend request');
    },
  });

  // Reject friend request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.rpc('reject_friend_request', {
        request_id: requestId
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests-received'] });
      queryClient.invalidateQueries({ queryKey: ['friendship-status'] });
      toast.success('Friend request rejected');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject friend request');
    },
  });

  // Get friendship status with a specific user
  const getFriendshipStatus = useCallback(async (userId: string): Promise<FriendshipStatus> => {
    const { data, error } = await supabase.rpc('get_friendship_status', {
      other_user_id: userId
    });

    if (error) throw error;
    return data;
  }, []);

  // Helper functions
  const sendFriendRequest = useCallback(async (userId: string) => {
    setLoadingStates(prev => ({ ...prev, [userId]: true }));
    try {
      await sendRequestMutation.mutateAsync(userId);
    } finally {
      setLoadingStates(prev => ({ ...prev, [userId]: false }));
    }
  }, [sendRequestMutation]);

  const acceptFriendRequest = useCallback(async (requestId: string) => {
    setLoadingStates(prev => ({ ...prev, [requestId]: true }));
    try {
      await acceptRequestMutation.mutateAsync(requestId);
    } finally {
      setLoadingStates(prev => ({ ...prev, [requestId]: false }));
    }
  }, [acceptRequestMutation]);

  const rejectFriendRequest = useCallback(async (requestId: string) => {
    setLoadingStates(prev => ({ ...prev, [requestId]: true }));
    try {
      await rejectRequestMutation.mutateAsync(requestId);
    } finally {
      setLoadingStates(prev => ({ ...prev, [requestId]: false }));
    }
  }, [rejectRequestMutation]);

  return {
    receivedRequests: receivedRequests || [],
    sentRequests: sentRequests || [],
    isLoading: receivedLoading || sentLoading,
    loadingStates,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriendshipStatus,
  };
}

// Hook for checking friendship status with a specific user
export function useFriendshipStatus(userId?: string) {
  return useQuery({
    queryKey: ['friendship-status', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase.rpc('get_friendship_status', {
        other_user_id: userId
      });

      if (error) throw error;
      return data as FriendshipStatus;
    },
    enabled: !!userId,
    staleTime: 30000,
  });
}
