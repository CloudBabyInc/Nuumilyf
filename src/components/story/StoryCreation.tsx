
import React, { useState, useRef } from 'react';
import { Camera, X, Send, Image, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

interface StoryCreationProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const StoryCreation: React.FC<StoryCreationProps> = ({
  onClose,
  onSuccess
}) => {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    if (!isVideo && !isImage) {
      toast.error('Please select an image or video file');
      return;
    }
    
    if (isVideo && file.size > 50 * 1024 * 1024) {
      toast.error('Video size should be less than 50MB');
      return;
    }
    
    if (isImage && file.size > 10 * 1024 * 1024) {
      toast.error('Image size should be less than 10MB');
      return;
    }
    
    setMediaFile(file);
    setMediaType(isVideo ? 'video' : 'image');
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle media upload button click
  const handleUploadClick = (type: 'image' | 'video') => {
    setMediaType(type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : 'video/*';
      fileInputRef.current.click();
    }
  };

  // Remove selected media
  const handleRemoveMedia = () => {
    setMediaFile(null);
    setPreview(null);
  };

  // Submit the story
  const handleSubmit = async () => {
    if (!mediaFile) {
      toast.error('Please select a media file');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Get the current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You need to be logged in to post stories');
        return;
      }
      
      // Upload the media file
      const fileExt = mediaFile.name.split('.').pop();
      const fileName = `${nanoid()}.${fileExt}`;
      const filePath = `stories/${session.user.id}/${fileName}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('media')
        .upload(filePath, mediaFile, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload media: ${uploadError.message}`);
      }
      
      // Get the public URL
      const { data: publicURLData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
        
      if (!publicURLData || !publicURLData.publicUrl) {
        throw new Error('Failed to get public URL');
      }
      
      // Create the story in the database
      const { error: dbError } = await supabase
        .from('stories')
        .insert({
          user_id: session.user.id,
          image_url: publicURLData.publicUrl,
          caption: caption.trim() || null,
          // Expires after 24 hours
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
        
      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to save story: ${dbError.message}`);
      }
      
      toast.success('Story posted successfully');
      onSuccess?.();
      onClose();
      
    } catch (error: any) {
      console.error('Error posting story:', error);
      toast.error(error.message || 'Failed to post story');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Create Story</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {preview ? (
            <div className="relative aspect-[9/16] bg-muted rounded-lg overflow-hidden mb-4">
              {mediaType === 'image' ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={preview}
                  className="w-full h-full object-contain"
                  controls
                />
              )}
              <button
                onClick={handleRemoveMedia}
                className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black/80 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="flex justify-center gap-4 mb-6">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 flex flex-col items-center py-8 gap-2"
                onClick={() => handleUploadClick('image')}
              >
                <Image size={32} />
                <span>Image</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 flex flex-col items-center py-8 gap-2"
                onClick={() => handleUploadClick('video')}
              >
                <Video size={32} />
                <span>Video</span>
              </Button>
            </div>
          )}
          
          <Textarea
            placeholder="Add a caption to your story..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={200}
            className="resize-none"
          />
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept={mediaType === 'image' ? 'image/*' : 'video/*'}
          />
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!mediaFile || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? 'Posting...' : 'Post Story'}
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoryCreation;
