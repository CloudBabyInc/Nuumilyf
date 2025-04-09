import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileBio from '@/components/profile/ProfileBio';
import ProfileActions from '@/components/profile/ProfileActions';
import SupportCard from '@/components/support/SupportCard';
import { Utensils, Baby, Wallet, MapPin, Loader2, Camera, MessageCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import EditProfileDialog from '@/components/profile/EditProfileDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Post from '@/components/shared/Post';

interface ProfilePageParams {
  [key: string]: string | undefined;
  userId?: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams<ProfilePageParams>();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const { profile, isLoading, error, refetch } = useProfile(userId);
  const [posts, setPosts] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [postsCount, setPostsCount] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isCurrentUserProfile, setIsCurrentUserProfile] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      setIsLoadingSession(true);
      const { data } = await supabase.auth.getSession();
      setCurrentUser(data.session?.user || null);
      
      // Check if we're viewing our own profile or someone else's
      if (data.session?.user) {
        if (!userId) {
          // No userId in URL means viewing own profile
          setIsCurrentUserProfile(true);
        } else {
          // Compare the URL userId with current user's ID
          setIsCurrentUserProfile(userId === data.session.user.id);
        }
      } else {
        setIsCurrentUserProfile(false);
      }
      
      setIsLoadingSession(false);
    };
    
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setCurrentUser(session?.user || null);
        
        // Update currentUserProfile state when auth state changes
        if (session?.user) {
          if (!userId) {
            setIsCurrentUserProfile(true);
          } else {
            setIsCurrentUserProfile(userId === session.user.id);
          }
        } else {
          setIsCurrentUserProfile(false);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.id) return;
      
      setIsLoadingStats(true);
      
      const { count: followersCount, error: followersError } = await supabase
        .from('followers')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', profile.id);
        
      if (followersError) {
        console.error('Error fetching followers count:', followersError);
      } else {
        setFollowersCount(followersCount || 0);
      }
      
      const { count: followingCount, error: followingError } = await supabase
        .from('followers')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', profile.id);
        
      if (followingError) {
        console.error('Error fetching following count:', followingError);
      } else {
        setFollowingCount(followingCount || 0);
      }
      
      const { count: postsCount, error: postsError } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id);
        
      if (postsError) {
        console.error('Error fetching posts count:', postsError);
      } else {
        setPostsCount(postsCount || 0);
      }
      
      if (currentUser?.id) {
        const { data: followData, error: followError } = await supabase
          .from('followers')
          .select('id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.id)
          .maybeSingle();
          
        if (followError) {
          console.error('Error checking follow status:', followError);
        } else {
          setIsFollowing(!!followData);
        }
      }
      
      setIsLoadingStats(false);
    };
    
    fetchStats();
  }, [profile?.id, currentUser?.id]);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!profile?.id) return;
      
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, content, image_url, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (postsError) {
        console.error('Error fetching posts:', postsError);
        return;
      }
      
      if (!postsData) return;
      
      const formattedPosts = postsData.map(post => ({
        id: post.id,
        content: post.content,
        image_url: post.image_url,
        created_at: post.created_at,
        author: {
          id: profile.id,
          name: profile.display_name || profile.username || 'Anonymous',
          username: profile.username || 'anonymous',
          avatar_url: profile.avatar_url,
          is_verified: profile.is_verified
        },
        likes_count: 0,
        comments_count: 0,
        reposts_count: 0,
        isLiked: false
      }));
      
      const postsWithMetrics = await Promise.all(
        formattedPosts.map(async (post) => {
          const { count: likesCount, error: likesError } = await supabase
            .from('likes')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', post.id);
            
          if (likesError) {
            console.error('Error fetching likes count:', likesError);
          }
          
          const { count: commentsCount, error: commentsError } = await supabase
            .from('comments')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', post.id);
            
          if (commentsError) {
            console.error('Error fetching comments count:', commentsError);
          }
          
          const { count: repostsCount, error: repostsError } = await supabase
            .from('reposts')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', post.id);
            
          if (repostsError) {
            console.error('Error fetching reposts count:', repostsError);
          }
          
          let isLiked = false;
          if (currentUser?.id) {
            const { data: likeData, error: likeError } = await supabase
              .from('likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', currentUser.id)
              .maybeSingle();
              
            if (likeError) {
              console.error('Error checking like status:', likeError);
            } else {
              isLiked = !!likeData;
            }
          }
          
          return {
            ...post,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            reposts_count: repostsCount || 0,
            isLiked
          };
        })
      );
      
      setPosts(postsWithMetrics);
    };
    
    fetchPosts();
  }, [profile?.id, currentUser?.id]);

  const handleAvatarClick = (event: React.MouseEvent) => {
    if (currentUser?.id === profile?.id) {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.onchange = async (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
          try {
            toast.loading('Uploading avatar...');
            
            // To be handled by the edit profile form
            // This is a placeholder - the actual implementation is in the EditProfileForm
          } catch (error) {
            console.error('Error uploading avatar:', error);
            toast.error('Failed to upload avatar');
          }
        }
      };
      fileInput.click();
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    
    if (!profile?.id || currentUser.id === profile.id) return;
    
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.id);
          
        if (error) throw error;
        
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        toast.success(`Unfollowed ${profile.display_name || profile.username || 'user'}`);
      } else {
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: currentUser.id,
            following_id: profile.id
          });
          
        if (error) throw error;
        
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast.success(`Following ${profile.display_name || profile.username || 'user'}`);
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
      toast.error('Failed to update follow status');
    }
  };

  const handleStartChat = async () => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    
    if (!profile?.id || currentUser.id === profile.id) return;
    
    try {
      // Check if conversation already exists
      const { data: existingParticipants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUser.id);
        
      if (participantsError) throw participantsError;
      
      if (existingParticipants && existingParticipants.length > 0) {
        const conversationIds = existingParticipants.map(p => p.conversation_id);
        
        const { data: otherParticipants, error: otherParticipantsError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .in('conversation_id', conversationIds)
          .eq('user_id', profile.id);
          
        if (otherParticipantsError) throw otherParticipantsError;
        
        if (otherParticipants && otherParticipants.length > 0) {
          // Conversation exists, navigate to it
          navigate(`/chats/${otherParticipants[0].conversation_id}`);
          return;
        }
      }
      
      // Create new conversation if it doesn't exist
      const { data: newConversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({})
        .select('id')
        .single();
        
      if (conversationError) throw conversationError;
      
      // Add participants to the conversation
      const { error: currentUserPartError } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: newConversation.id,
          user_id: currentUser.id
        });
        
      if (currentUserPartError) throw currentUserPartError;
      
      const { error: otherUserPartError } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: newConversation.id,
          user_id: profile.id
        });
        
      if (otherUserPartError) throw otherUserPartError;
      
      navigate(`/chats/${newConversation.id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start conversation');
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) {
      toast.error('Please sign in to like posts');
      return;
    }
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    try {
      if (post.isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);
          
        if (error) throw error;
        
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, isLiked: false, likes_count: p.likes_count - 1 } 
            : p
        ));
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: currentUser.id
          });
          
        if (error) throw error;
        
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, isLiked: true, likes_count: p.likes_count + 1 } 
            : p
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like status');
    }
  };

  const displayName = profile?.display_name || 'User Profile';
  const username = profile?.username || 'username';
  const location = profile?.location;
  const bio = profile?.bio;
  const avatarUrl = profile?.avatar_url;

  if (isLoading || isLoadingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-nuumi-pink" />
      </div>
    );
  }

  const pageTitle = isCurrentUserProfile ? "My Profile" : displayName;
  
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header 
        title={pageTitle} 
        showSettings={isCurrentUserProfile}
        showBackButton={!isCurrentUserProfile}
        onBackClick={() => navigate(-1)}
      />
      
      <div className="max-w-md mx-auto">
        <ProfileHeader 
          avatar={avatarUrl || undefined}
          onAvatarClick={isCurrentUserProfile ? handleAvatarClick : () => {}}
        />
        
        <ProfileStats 
          posts={postsCount}
          followers={followersCount}
          following={followingCount}
          userId={profile?.id}
          currentUserId={currentUser?.id}
        />
        
        <ProfileBio
          username={username}
          displayName={displayName}
          bio={bio || undefined}
          location={location || undefined}
        >
          {isCurrentUserProfile && !location && (
            <div className="flex items-center text-sm text-muted-foreground mb-1 justify-center">
              <MapPin size={14} className="mr-1 text-nuumi-pink" />
              <span>Add your neighborhood</span>
            </div>
          )}
          
          {isCurrentUserProfile && !bio && (
            <div className="text-sm text-muted-foreground">
              Add child age • Add dietary needs{' '}
              <EditProfileDialog 
                trigger={
                  <span className="text-nuumi-pink ml-1 font-medium cursor-pointer">Edit</span>
                }
                initialData={{
                  username: username === 'username' ? '' : username,
                  displayName: displayName === 'User Profile' ? '' : displayName,
                  bio: bio || '',
                  location: location || '',
                  avatarUrl: avatarUrl || undefined
                }}
              />
            </div>
          )}
        </ProfileBio>
        
        <ProfileActions
          isCurrentUser={isCurrentUserProfile}
          onEditProfile={() => {}}
          isFollowing={isFollowing}
          userId={profile?.id}
          onFollow={handleFollowToggle}
          onMessage={handleStartChat}
          editProfileButton={
            isCurrentUserProfile ? (
              <EditProfileDialog 
                trigger={
                  <button className="w-full bg-nuumi-pink text-white rounded-full py-2.5 font-medium flex items-center justify-center transition-all hover:bg-nuumi-pink/90 mb-6">
                    <Camera size={18} className="mr-2" />
                    Edit Profile
                  </button>
                }
                initialData={{
                  username: username === 'username' ? '' : username,
                  displayName: displayName === 'User Profile' ? '' : displayName,
                  bio: bio || '',
                  location: location || '',
                  avatarUrl: avatarUrl || undefined
                }}
              />
            ) : (
              <div className="flex space-x-3 px-4 mb-6">
                <button 
                  className={`flex-1 py-2.5 rounded-full font-medium transition-all flex items-center justify-center ${
                    isFollowing 
                      ? 'border border-nuumi-pink text-nuumi-pink' 
                      : 'bg-nuumi-pink text-white hover:bg-nuumi-pink/90'
                  }`}
                  onClick={handleFollowToggle}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                
                <button 
                  className="flex-1 border border-nuumi-pink text-nuumi-pink rounded-full py-2.5 font-medium flex items-center justify-center transition-all hover:bg-nuumi-pink/10"
                  onClick={handleStartChat}
                >
                  <MessageCircle size={18} className="mr-2" />
                  Message
                </button>
              </div>
            )
          }
        />
        
        {isCurrentUserProfile && (
          <div className="px-4">
            <button 
              className="w-full bg-nuumi-pink text-white rounded-full py-3 font-medium transition-all hover:bg-nuumi-pink/90 mb-8"
              onClick={() => navigate('/create')}
            >
              Add Post
            </button>
            
            <div className="mb-3">
              <h3 className="text-lg font-semibold mb-3">Mom Support</h3>
              <div className="grid grid-cols-3 gap-3">
                <SupportCard
                  icon={Utensils}
                  title="Plan Meals"
                  onClick={() => console.log('Plan Meals clicked')}
                />
                
                <SupportCard
                  icon={Baby}
                  title="Find Care"
                  onClick={() => console.log('Find Care clicked')}
                />
                
                <SupportCard
                  icon={Wallet}
                  title="Wallet"
                  onClick={() => console.log('Wallet clicked')}
                />
              </div>
            </div>
          </div>
        )}
        
        <div className="px-4 mt-6">
          <h3 className="text-lg font-semibold mb-3">Posts</h3>
          
          {posts.length > 0 ? (
            <div className="space-y-3">
              {posts.map(post => (
                <Post
                  key={post.id}
                  author={{
                    id: post.author.id,
                    name: post.author.name,
                    username: post.author.username,
                    avatar: post.author.avatar_url || undefined,
                    isVerified: post.author.is_verified,
                    timeAgo: new Date(post.created_at).toLocaleDateString()
                  }}
                  content={post.content}
                  image={post.image_url || undefined}
                  likes={post.likes_count}
                  comments={post.comments_count}
                  reposts={post.reposts_count}
                  isLiked={post.isLiked}
                  onLike={() => handleLike(post.id)}
                  onComment={() => {}}
                  onRepost={() => {}}
                  onShare={() => {}}
                />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              <p>{isCurrentUserProfile ? 'Share your first post with other moms' : 'No posts yet'}</p>
            </div>
          )}
        </div>
      </div>
      
      <Navbar />
    </div>
  );
};

export default Profile;
