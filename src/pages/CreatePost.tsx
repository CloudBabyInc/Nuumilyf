
import React from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImagePlus } from 'lucide-react';

const CreatePost = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Create Post" />
      
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="bg-card rounded-xl p-4 mb-4">
          <Textarea 
            placeholder="What's on your mind?" 
            className="border-0 focus-visible:ring-0 resize-none text-base"
            rows={6}
          />
          
          <div className="flex justify-between items-center mt-4">
            <button className="flex items-center text-nuumi-pink">
              <ImagePlus size={20} className="mr-2" />
              <span>Add Photo</span>
            </button>
            
            <Button className="rounded-full px-6">
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
