
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, X, Upload, Loader2 } from 'lucide-react';
import Avatar from '../shared/Avatar';
import { Card, CardContent } from '@/components/ui/card';

interface ProfileFormValues {
  username: string;
  displayName: string;
  bio: string;
  location: string;
}

interface EditProfileFormProps {
  onClose: () => void;
  initialData?: {
    username?: string;
    displayName?: string;
    bio?: string;
    location?: string;
    avatarUrl?: string;
  };
}

const EditProfileForm = ({ onClose, initialData }: EditProfileFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(initialData?.avatarUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(initialData?.avatarUrl);

  const form = useForm<ProfileFormValues>({
    defaultValues: {
      username: initialData?.username || '',
      displayName: initialData?.displayName || '',
      bio: initialData?.bio || '',
      location: initialData?.location || '',
    }
  });

  useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
      
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [selectedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Only allow image files
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!selectedFile) return avatarUrl || null;
    
    setIsUploading(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('No authenticated user');
      }
      
      const userId = sessionData.session.user.id;
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile_images')
        .upload(fileName, selectedFile, { upsert: true });
        
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('profile_images')
        .getPublicUrl(fileName);
        
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
      return avatarUrl || null;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('No authenticated user');
      }
      
      const userId = sessionData.session.user.id;
      
      // Upload avatar if a new file is selected
      let newAvatarUrl = await uploadAvatar();
      
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          username: values.username,
          display_name: values.displayName,
          bio: values.bio,
          location: values.location,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (error) throw error;
      
      toast.success('Profile updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const removeAvatar = () => {
    setSelectedFile(null);
    setPreviewUrl(undefined);
    setAvatarUrl(undefined);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>
        
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Avatar 
              src={previewUrl} 
              alt="Profile" 
              size="xl" 
              className="border-2 border-nuumi-pink"
            />
            
            {(previewUrl || avatarUrl) && (
              <button 
                onClick={removeAvatar}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
              >
                <X size={16} className="text-gray-700" />
              </button>
            )}
            
            <div className="mt-2 flex justify-center">
              <label className="cursor-pointer flex items-center gap-2 text-xs font-medium bg-secondary py-1 px-3 rounded-full hover:bg-secondary/80 transition-colors">
                <Upload size={14} />
                Upload Photo
                <input 
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your display name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about yourself" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        placeholder="Your location" 
                        className="pl-9" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-nuumi-pink hover:bg-nuumi-pink/90"
                disabled={isLoading || isUploading}
              >
                {(isLoading || isUploading) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EditProfileForm;
