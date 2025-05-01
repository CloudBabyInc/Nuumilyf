
import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Route, Routes, useParams } from 'react-router-dom';
import ChatList from '@/components/chat/ChatList';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import ConnectedUsersList from '@/components/chat/ConnectedUsersList';
import { toast } from 'sonner';
import { Loader2, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Main Chats Page Component
const ChatsMainPage = () => {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('recent');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-md mx-auto pt-2 pb-20">
        {session ? (
          <Tabs
            defaultValue="recent"
            className="w-full"
            onValueChange={setActiveTab}
          >
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="recent">Recent Chats</TabsTrigger>
              <TabsTrigger value="connected">Connections</TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="mt-0">
              <ChatList currentUserId={session?.user?.id} />
            </TabsContent>

            <TabsContent value="connected" className="mt-0">
              <div className="bg-card rounded-lg overflow-hidden">
                <div className="p-4 bg-muted/50 border-b flex items-center">
                  <Users size={18} className="mr-2 text-nuumi-pink" />
                  <h3 className="font-medium">My Connections</h3>
                </div>
                <ConnectedUsersList currentUserId={session?.user?.id} />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center mt-10">
            <p className="text-muted-foreground">Please sign in to view your messages</p>
          </div>
        )}
      </div>

      <Navbar />
    </div>
  );
};

// Single user chat - direct messages from a profile
const DirectMessagePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    const initializeDirectMessage = async () => {
      if (!session || !userId) return;

      try {
        setLoading(true);

        // Check if the user exists
        const { data: userProfile, error: userError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single();

        if (userError || !userProfile) {
          toast.error('User not found');
          navigate('/chats');
          return;
        }

        // Get the conversation participants and find conversations that have both users
        // First get currentUser's participants
        const { data: myParticipants, error: myParticipantsError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', session.user.id);

        if (myParticipantsError) throw myParticipantsError;

        let matchingConversationId: string | null = null;

        if (myParticipants && myParticipants.length > 0) {
          const conversationIds = myParticipants.map(p => p.conversation_id);

          // Find conversations where the other user is also a participant
          const { data: otherParticipants, error: otherError } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', userId)
            .in('conversation_id', conversationIds);

          if (otherError) throw otherError;

          // If there's a match, use the first conversation found
          if (otherParticipants && otherParticipants.length > 0) {
            matchingConversationId = otherParticipants[0].conversation_id;
          }
        }

        if (matchingConversationId) {
          // Conversation exists, navigate to it
          navigate(`/chats/${matchingConversationId}`);
          return;
        }

        // Create new conversation if none exists
        // The table only has id, created_at, and updated_at columns with default values
        const { data: newConversation, error: newConversationError } = await supabase
          .from('conversations')
          .insert({})  // Empty object - let the database use default values
          .select('id')
          .single();

        if (newConversationError) {
          console.error('Error creating conversation:', newConversationError);
          throw new Error('Failed to create conversation');
        }

        // Add current user as participant
        const { error: currentUserError } = await supabase
          .from('conversation_participants')
          .insert({
            conversation_id: newConversation.id,
            user_id: session.user.id
            // created_at will be set automatically by the database
          });

        if (currentUserError) {
          console.error('Error adding current user to conversation:', currentUserError);
          throw new Error('Failed to add you to the conversation');
        }

        // Add the other user directly - we'll rely on the Edge Function later
        try {
          // Add the other user as participant directly
          const { error: otherUserError } = await supabase
            .from('conversation_participants')
            .insert({
              conversation_id: newConversation.id,
              user_id: userId
            });

          if (otherUserError) {
            console.error('Error adding other user to conversation:', otherUserError);
            // Continue anyway - the conversation is created
          } else {
            console.log('Successfully added other user to conversation');
          }

          // Add a welcome message
          const { error: messageError } = await supabase
            .from('messages')
            .insert({
              conversation_id: newConversation.id,
              sender_id: session.user.id,
              content: 'Hello! I started this conversation.',
              topic: 'message',
              extension: '',
              read: false
            });

          if (messageError) {
            console.error('Error adding welcome message:', messageError);
          } else {
            console.log('Welcome message added successfully');
          }
        } catch (error) {
          console.error('Error in conversation setup:', error);
          // Continue anyway - the conversation is created
        }

        // Navigate to the new conversation
        navigate(`/chats/${newConversation.id}`);

      } catch (error: any) {
        console.error('Error creating direct message:', error);

        // Log detailed error information
        if (error.details) console.error('Error details:', error.details);
        if (error.hint) console.error('Error hint:', error.hint);
        if (error.code) console.error('Error code:', error.code);

        // Show more specific error message if available
        if (error.message) {
          toast.error(`Error: ${error.message}`);
        } else if (error.code === '23505') {
          toast.error('A conversation with this user already exists');
        } else if (error.code === '23503') {
          toast.error('User not found');
        } else if (error.code === '42P01') {
          toast.error('Database table not found. Please contact support.');
        } else if (error.code && error.code.startsWith('42')) {
          toast.error('Database schema error. Please contact support.');
        } else if (error.code && error.code.startsWith('23')) {
          toast.error('Database constraint violation. Please try again later.');
        } else {
          toast.error('Failed to start conversation. Please try again later.');
        }

        // Add a small delay before navigating to ensure the toast is visible
        setTimeout(() => {
          navigate('/chats');
        }, 500);
      } finally {
        setLoading(false);
      }
    };

    initializeDirectMessage();
  }, [session, userId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-nuumi-pink" />
      </div>
    );
  }

  return null; // This component will redirect to either /chats or /chats/:conversationId
};

// Conversation Component
const ConversationPage = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [session, setSession] = useState<any>(null);
  const [recipient, setRecipient] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !conversationId) return;

    const fetchConversation = async () => {
      setLoading(true);

      // First validate the conversation exists and user is a participant
      const { data: userParticipation, error: participationError } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .eq('user_id', session.user.id)
        .single();

      if (participationError || !userParticipation) {
        console.error('Error validating conversation access:', participationError);
        toast.error('You don\'t have access to this conversation');
        navigate('/chats');
        return;
      }

      // Get the other participant
      const { data: participants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .neq('user_id', session.user.id);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        toast.error('Failed to load conversation');
        navigate('/chats');
        return;
      }

      if (!participants || participants.length === 0) {
        // If there are no other participants, we'll just show a placeholder
        setRecipient({
          id: 'placeholder',
          name: 'New Conversation',
          avatar: undefined,
          isOnline: false
        });
      } else {
        const recipientId = participants[0].user_id;

        // Get recipient profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url')
          .eq('id', recipientId)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          toast.error('Failed to load recipient profile');
        } else if (profile) {
          setRecipient({
            id: profile.id,
            name: profile.display_name || profile.username || 'Anonymous',
            avatar: profile.avatar_url || undefined,
            isOnline: false // Will update with presence later
          });
        }
      }

      // Get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id, read')
        .eq('conversation_id', conversationId)
        .order('created_at');

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        toast.error('Failed to load messages');
      } else if (messagesData) {
        setMessages(messagesData.map(msg => ({
          id: msg.id,
          content: msg.content,
          timestamp: msg.created_at,
          senderId: msg.sender_id,
          status: msg.read ? 'read' : 'delivered'
        })));
      }

      // Mark messages as read
      if (messagesData && messagesData.length > 0) {
        const unreadMessages = messagesData
          .filter(msg => !msg.read && msg.sender_id !== session.user.id)
          .map(msg => msg.id);

        if (unreadMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ read: true })
            .in('id', unreadMessages);
        }
      }

      setLoading(false);
    };

    fetchConversation();

    // Set up realtime subscription for new messages
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Add the new message to the list
          const newMessage = payload.new as any;

          setMessages(current => [
            ...current,
            {
              id: newMessage.id,
              content: newMessage.content,
              timestamp: newMessage.created_at,
              senderId: newMessage.sender_id,
              status: newMessage.read ? 'read' : 'delivered'
            }
          ]);

          // Mark message as read if it's from the other person
          if (newMessage.sender_id !== session.user.id) {
            await supabase
              .from('messages')
              .update({ read: true })
              .eq('id', newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, session, navigate]);

  const handleSendMessage = async (content: string) => {
    if (!session || !conversationId || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: session.user.id,
          content: content.trim(),
          topic: 'message', // Required field
          extension: '', // Required field
          event: 'message', // Optional but good to set
          private: false, // Optional but good to set
          read: false // Optional but good to set
        });

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to view your messages</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {recipient && <ChatHeader recipient={recipient} />}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-nuumi-pink" />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-hidden">
            <MessageList
              messages={messages}
              currentUserId={session?.user?.id}
            />
          </div>

          <MessageInput onSendMessage={handleSendMessage} />
        </>
      )}
    </div>
  );
};

// Main Component with Routes
const Chats = () => {
  return (
    <Routes>
      <Route path="/" element={<ChatsMainPage />} />
      <Route path="/user/:userId" element={<DirectMessagePage />} />
      <Route path="/:conversationId" element={<ConversationPage />} />
    </Routes>
  );
};

export default Chats;
