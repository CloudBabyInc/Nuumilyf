
import React from 'react';
import { Heart, MessageSquare, Repeat2, Send } from 'lucide-react';
import Avatar from './Avatar';
import { cn } from '@/lib/utils';

interface PostProps {
  author: {
    name: string;
    username: string;
    avatar?: string;
    isVerified?: boolean;
    timeAgo: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  reposts: number;
  isLiked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onRepost?: () => void;
  onShare?: () => void;
}

const Post = ({
  author,
  content,
  image,
  likes,
  comments,
  reposts,
  isLiked = false,
  onLike,
  onComment,
  onRepost,
  onShare
}: PostProps) => {
  return (
    <div className="bg-card rounded-xl p-4 mb-3 animate-fade-in">
      <div className="flex items-start mb-3">
        <Avatar src={author.avatar} alt={author.name} size="md" />
        <div className="ml-3 flex flex-col">
          <div className="flex items-center">
            <h4 className="font-semibold text-foreground">{author.name}</h4>
            {author.isVerified && (
              <span className="ml-1 text-nuumi-pink">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
            <span className="text-sm text-muted-foreground ml-2">· {author.timeAgo}</span>
          </div>
          <span className="text-sm text-muted-foreground">@{author.username}</span>
        </div>
      </div>
      
      <p className="text-foreground mb-3 text-balance">{content}</p>
      
      {image && (
        <div className="rounded-xl overflow-hidden mb-3 bg-secondary/30 relative">
          <img 
            src={image} 
            alt="Post content" 
            className="w-full object-cover max-h-96 transition-opacity duration-300"
            loading="lazy"
          />
        </div>
      )}
      
      <div className="flex items-center justify-between mt-2">
        <button 
          onClick={onLike}
          className={cn(
            "flex items-center text-sm text-muted-foreground hover:text-nuumi-pink transition-colors",
            isLiked && "text-nuumi-pink"
          )}
        >
          <Heart size={18} className={cn("mr-1", isLiked && "fill-nuumi-pink")} />
          <span>{likes}</span>
        </button>
        
        <button 
          onClick={onComment}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageSquare size={18} className="mr-1" />
          <span>{comments}</span>
        </button>
        
        <button 
          onClick={onRepost}
          className="flex items-center text-sm text-muted-foreground hover:text-green-500 transition-colors"
        >
          <Repeat2 size={18} className="mr-1" />
          <span>{reposts}</span>
        </button>
        
        <button 
          onClick={onShare}
          className="flex items-center text-sm text-muted-foreground hover:text-blue-500 transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default Post;
