
import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

export interface StoryCreationHookProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const useStoryCreation = ({ onClose, onSuccess }: StoryCreationHookProps) => {
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

  return {
    mediaFile,
    preview,
    mediaType,
    caption,
    isSubmitting,
    fileInputRef,
    setCaption,
    handleFileChange,
    handleUploadClick,
    handleRemoveMedia,
    handleSubmit
  };
};
