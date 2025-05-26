import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import Post from '@/components/shared/Post';
import StoriesRow from '@/components/story/StoriesRow';
import { supabase } from '@/integrations/supabase/client';
import { StoryItem } from '@/components/story/Story';
import { Skeleton } from '@/components/ui/skeleton';

interface PostType {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  isLiked: boolean;
}

const Feed = () => {
  const [session, setSession] = useState<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: stories, isLoading: storiesLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: async () => {
      const now = new Date().toISOString();

      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select(`
          id,
          image_url,
          caption,
          created_at,
          user_id,
          expires_at
        `)
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (storiesError) {
        console.error('Error fetching stories:', storiesError);
        throw storiesError;
      }

      const storiesWithProfiles = await Promise.all(storiesData.map(async (story) => {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url')
          .eq('id', story.user_id)
          .single();

        if (profileError) {
          console.error('Error fetching profile for story:', profileError);
          return null;
        }

        const mediaType = story.image_url && (
          story.image_url.endsWith('.mp4') ||
          story.image_url.endsWith('.mov') ||
          story.image_url.endsWith('.webm')
        ) ? 'video' : 'image';

        return {
          id: story.id,
          user: {
            id: profileData.id,
            name: profileData.display_name || profileData.username,
            username: profileData.username,
            avatar: profileData.avatar_url
          },
          media: [{
            type: mediaType,
            url: story.image_url
          }],
          caption: story.caption,
          createdAt: story.created_at
        };
      }));

      return storiesWithProfiles.filter(Boolean) as StoryItem[];
    },
    enabled: !!session,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!session) return;

    const postsChannel = supabase
      .channel('public:posts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      })
      .subscribe();

    const likesChannel = supabase
      .channel('public:likes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'likes',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      })
      .subscribe();

    const commentsChannel = supabase
      .channel('public:comments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      })
      .subscribe();

    const repostsChannel = supabase
      .channel('public:reposts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reposts',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(repostsChannel);
    };
  }, [session, queryClient]);

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      // Fetch posts first
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(20); // Limit for better performance

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        throw postsError;
      }

      if (!postsData || postsData.length === 0) {
        console.log('No posts found in database');
        return [];
      }

      console.log(`Found ${postsData.length} posts`);

      // Get all post IDs and user IDs for batch queries
      const postIds = postsData.map(post => post.id);
      const userIds = [...new Set(postsData.map(post => post.user_id))];

      // Batch query for profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, is_verified')
        .in('id', userIds);

      // Batch query for likes counts
      const { data: likesData } = await supabase
        .from('likes')
        .select('post_id')
        .in('post_id', postIds);

      // Batch query for comments counts
      const { data: commentsData } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds);

      // Batch query for reposts counts
      const { data: repostsData } = await supabase
        .from('reposts')
        .select('post_id')
        .in('post_id', postIds);

      // Batch query for user's likes if logged in
      let userLikesData = [];
      if (session?.user?.id) {
        const { data } = await supabase
          .from('likes')
          .select('post_id')
          .in('post_id', postIds)
          .eq('user_id', session.user.id);
        userLikesData = data || [];
      }

      // Create lookup maps for O(1) access
      const profilesMap = profilesData?.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      const likesCountMap = likesData?.reduce((acc, like) => {
        acc[like.post_id] = (acc[like.post_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const commentsCountMap = commentsData?.reduce((acc, comment) => {
        acc[comment.post_id] = (acc[comment.post_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const repostsCountMap = repostsData?.reduce((acc, repost) => {
        acc[repost.post_id] = (acc[repost.post_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const userLikesSet = new Set(userLikesData.map(like => like.post_id));

      // Transform data with O(1) lookups
      const transformedPosts = postsData.map(post => {
        const profile = profilesMap[post.user_id];
        if (!profile) {
          console.warn(`No profile found for user ${post.user_id}`);
          return null;
        }

        return {
          id: post.id,
          content: post.content,
          image_url: post.image_url,
          created_at: post.created_at,
          author: {
            id: profile.id,
            name: profile.full_name || profile.username,
            username: profile.username,
            avatar_url: profile.avatar_url,
            is_verified: profile.is_verified || false
          },
          likes_count: likesCountMap[post.id] || 0,
          comments_count: commentsCountMap[post.id] || 0,
          reposts_count: repostsCountMap[post.id] || 0,
          isLiked: userLikesSet.has(post.id)
        };
      }).filter(Boolean);

      console.log(`Returning ${transformedPosts.length} transformed posts`);
      return transformedPosts as PostType[];
    },
    enabled: !!session,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false
  });

  const handleLike = async (postId: string) => {
    if (!session) {
      toast.error('Please sign in to like posts');
      return;
    }

    const post = posts?.find(p => p.id === postId);
    if (!post) return;

    // Optimistic update is handled in the Post component
    // Here we just need to update the database

    try {
      if (post.isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', session.user.id);

        if (error) throw error;

        // Update the post in the cache
        queryClient.setQueryData(['posts'], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((p: any) =>
            p.id === postId
              ? { ...p, isLiked: false, likes_count: p.likes_count - 1 }
              : p
          );
        });
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: session.user.id
          });

        if (error) throw error;

        // Update the post in the cache
        queryClient.setQueryData(['posts'], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((p: any) =>
            p.id === postId
              ? { ...p, isLiked: true, likes_count: p.likes_count + 1 }
              : p
          );
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like status');

      // Refresh the data to ensure UI is in sync with server
      queryClient.invalidateQueries(['posts']);
    }
  };

  const handleComment = (postId: string) => {
    if (!session) {
      toast.error('Please sign in to comment');
      return;
    }
    console.log(`Comment on post ${postId}`);
  };

  const handleRepost = async (postId: string) => {
    if (!session) {
      toast.error('Please sign in to repost');
      return;
    }

    // Optimistic update is handled in the Post component

    try {
      // Check if already reposted
      const { data: existingRepost } = await supabase
        .from('reposts')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', session.user.id)
        .single();

      if (existingRepost) {
        toast.info('You have already reposted this');
        return;
      }

      const { error } = await supabase
        .from('reposts')
        .insert({
          post_id: postId,
          user_id: session.user.id
        });

      if (error) throw error;

      // Update the post in the cache
      queryClient.setQueryData(['posts'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((p: any) =>
          p.id === postId
            ? { ...p, reposts_count: p.reposts_count + 1 }
            : p
        );
      });

      toast.success('Post shared to your profile');
    } catch (error) {
      console.error('Error reposting:', error);
      toast.error('Failed to repost');

      // Refresh the data to ensure UI is in sync with server
      queryClient.invalidateQueries(['posts']);
    }
  };

  const handleShare = (postId: string) => {
    console.log(`Share post ${postId}`);
    const shareUrl = `${window.location.origin}/post/${postId}`;

    if (navigator.share) {
      navigator.share({
        title: 'Check out this post on nuumi',
        text: 'I found this interesting post on nuumi',
        url: shareUrl,
      }).catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          toast.success('Post link copied to clipboard');
        })
        .catch(err => {
          console.error('Error copying to clipboard:', err);
          toast.error('Failed to copy link');
        });
    }
  };

  const handleDelete = async (postId: string) => {
    if (!session) {
      toast.error('Please sign in to delete posts');
      return;
    }

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', session.user.id); // Ensure user can only delete their own posts

      if (error) throw error;

      // Remove the post from the cache
      queryClient.setQueryData(['posts'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((p: any) => p.id !== postId);
      });

      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleHide = (postId: string) => {
    // Remove the post from the cache (hide it locally)
    queryClient.setQueryData(['posts'], (oldData: any) => {
      if (!oldData) return oldData;
      return oldData.filter((p: any) => p.id !== postId);
    });

    toast.success('Post hidden from your feed');
  };

  const handleEdit = (postId: string) => {
    // Navigate to edit page or open edit modal
    console.log(`Edit post ${postId}`);
    toast.info('Edit functionality coming soon');
  };

  const handleReport = async (postId: string) => {
    if (!session) {
      toast.error('Please sign in to report posts');
      return;
    }

    try {
      // Check if user has already reported this post
      const { data: existingReport } = await supabase
        .from('reports')
        .select('*')
        .eq('post_id', postId)
        .eq('reporter_id', session.user.id)
        .single();

      if (existingReport) {
        toast.info('You have already reported this post');
        return;
      }

      // Create a new report
      const { error } = await supabase
        .from('reports')
        .insert({
          post_id: postId,
          reporter_id: session.user.id,
          reason: 'Inappropriate content' // You could add a reason selection dialog
        });

      if (error) throw error;

      toast.success('Post reported. Thank you for helping keep our community safe.');
    } catch (error) {
      console.error('Error reporting post:', error);
      toast.error('Failed to report post');
    }
  };

  if (!session && !postsLoading && !storiesLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header />

        <div className="max-w-md mx-auto px-4 mt-20 text-center">
          <h2 className="text-lg font-semibold mb-2">Welcome to nuumi</h2>
          <p className="text-muted-foreground mb-4">Sign in to see posts from other moms</p>
          {/* Auth buttons would go here */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <div className="max-w-md mx-auto">
        <StoriesRow
          stories={stories || []}
          isLoading={storiesLoading}
          className="mb-4 mt-2"
          currentUserId={session?.user?.id}
        />
      </div>

      <div className="max-w-md mx-auto px-4">
        {postsLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-4 mb-3">
              <div className="flex items-start mb-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="ml-3 flex flex-col gap-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-24 w-full mb-3" />
              <div className="flex justify-between">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-8" />
              </div>
            </div>
          ))
        ) : posts && posts.length > 0 ? (
          posts.map((post) => (
            <Post
              key={post.id}
              id={post.id}
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
              currentUser={session ? {
                id: session.user.id,
                avatarUrl: session.user.user_metadata?.avatar_url,
                username: session.user.user_metadata?.username || session.user.email?.split('@')[0],
                displayName: session.user.user_metadata?.display_name || session.user.user_metadata?.username || session.user.email?.split('@')[0]
              } : undefined}
              onLike={() => handleLike(post.id)}
              onComment={() => handleComment(post.id)}
              onRepost={() => handleRepost(post.id)}
              onShare={() => handleShare(post.id)}
              onDelete={() => handleDelete(post.id)}
              onHide={() => handleHide(post.id)}
              onEdit={() => handleEdit(post.id)}
              onReport={() => handleReport(post.id)}
            />
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No posts to show</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;
