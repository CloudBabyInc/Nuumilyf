
import React from 'react';
import Header from '@/components/layout/Header';
import Navbar from '@/components/layout/Navbar';
import Post from '@/components/shared/Post';

const Feed = () => {
  // Sample posts data
  const posts = [
    {
      id: 1,
      author: {
        name: 'Emma',
        username: 'emma_mom',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
        isVerified: true,
        timeAgo: '4h',
      },
      content: "Morning thought: Being a mom is like having a full-time job where your boss is a tiny human who doesn't understand the concept of weekends 😂",
      likes: 156,
      comments: 3,
      reposts: 14,
      isLiked: true,
    },
    {
      id: 2,
      author: {
        name: 'Sarah',
        username: 'sarah.williams',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
        timeAgo: '6h',
      },
      content: "Just had the most amazing mommy-daughter baking session! 🧁 The kitchen is a mess but her smile is worth it all. #MomLife",
      image: 'https://images.unsplash.com/photo-1515041219749-89347f83291a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      likes: 42,
      comments: 2,
      reposts: 5,
    }
  ];

  // Handle actions
  const handleLike = (postId: number) => {
    console.log(`Liked post ${postId}`);
  };

  const handleComment = (postId: number) => {
    console.log(`Comment on post ${postId}`);
  };

  const handleRepost = (postId: number) => {
    console.log(`Repost ${postId}`);
  };

  const handleShare = (postId: number) => {
    console.log(`Share post ${postId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <div className="max-w-md mx-auto px-4 mt-4">
        {posts.map((post) => (
          <Post
            key={post.id}
            author={post.author}
            content={post.content}
            image={post.image}
            likes={post.likes}
            comments={post.comments}
            reposts={post.reposts}
            isLiked={post.isLiked}
            onLike={() => handleLike(post.id)}
            onComment={() => handleComment(post.id)}
            onRepost={() => handleRepost(post.id)}
            onShare={() => handleShare(post.id)}
          />
        ))}
      </div>
      
      <Navbar />
    </div>
  );
};

export default Feed;
