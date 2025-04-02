
import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Navbar from '@/components/layout/Navbar';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileBio from '@/components/profile/ProfileBio';
import ProfileActions from '@/components/profile/ProfileActions';
import SupportCard from '@/components/support/SupportCard';
import { Utensils, Baby, Wallet, MapPin, Loader2, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import EditProfileDialog from '@/components/profile/EditProfileDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Profile = () => {
  const navigate = useNavigate();
  const { profile, isLoading, error, refetch } = useProfile();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  React.useEffect(() => {
    // Check if user is logged in
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
    };
    
    checkSession();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsLoggedIn(!!session);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const handleAvatarClick = (event: React.MouseEvent) => {
    // Handle the avatar click to open file select dialog when avatar is clicked
    if (isLoggedIn) {
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

  // Get the data to display in the profile
  const displayName = profile?.display_name || 'Your Story';
  const username = profile?.username || 'your.story';
  const location = profile?.location;
  const bio = profile?.bio;
  const avatarUrl = profile?.avatar_url;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-nuumi-pink" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header 
        title="Profile" 
        showSettings 
        onSettingsClick={() => console.log('Settings clicked')}
      />
      
      <div className="max-w-md mx-auto">
        <ProfileHeader 
          avatar={avatarUrl || undefined}
          onAvatarClick={handleAvatarClick}
        />
        
        <ProfileStats 
          posts={0}
          followers={0}
          following={0}
        />
        
        <ProfileBio
          username={username}
          displayName={displayName}
          bio={bio || undefined}
          location={location || undefined}
        >
          {!location && (
            <div className="flex items-center text-sm text-muted-foreground mb-1 justify-center">
              <MapPin size={14} className="mr-1 text-nuumi-pink" />
              <span>Add your neighborhood</span>
            </div>
          )}
          
          {!bio && (
            <div className="text-sm text-muted-foreground">
              Add child age • Add dietary needs{' '}
              {isLoggedIn && (
                <EditProfileDialog 
                  trigger={
                    <span className="text-nuumi-pink ml-1 font-medium cursor-pointer">Edit</span>
                  }
                  initialData={{
                    username: username === 'your.story' ? '' : username,
                    displayName: displayName === 'Your Story' ? '' : displayName,
                    bio: bio || '',
                    location: location || '',
                    avatarUrl: avatarUrl || undefined
                  }}
                />
              )}
            </div>
          )}
        </ProfileBio>
        
        <ProfileActions
          isCurrentUser={isLoggedIn || false}
          onEditProfile={() => {}}
          editProfileButton={
            <EditProfileDialog 
              trigger={
                <button className="w-full bg-nuumi-pink text-white rounded-full py-2.5 font-medium flex items-center justify-center transition-all hover:bg-nuumi-pink/90 mb-6">
                  <Camera size={18} className="mr-2" />
                  Edit Profile
                </button>
              }
              initialData={{
                username: username === 'your.story' ? '' : username,
                displayName: displayName === 'Your Story' ? '' : displayName,
                bio: bio || '',
                location: location || '',
                avatarUrl: avatarUrl || undefined
              }}
            />
          }
        />
        
        <div className="px-4">
          <button className="w-full bg-nuumi-pink text-white rounded-full py-3 font-medium transition-all hover:bg-nuumi-pink/90 mb-8">
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
          
          <div className="py-10 text-center text-muted-foreground">
            <p>Share your first post with other moms</p>
          </div>
        </div>
      </div>
      
      <Navbar />
    </div>
  );
};

export default Profile;
