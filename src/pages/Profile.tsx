
import React from 'react';
import Header from '@/components/layout/Header';
import Navbar from '@/components/layout/Navbar';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileBio from '@/components/profile/ProfileBio';
import ProfileActions from '@/components/profile/ProfileActions';
import SupportCard from '@/components/support/SupportCard';
import { Utensils, Baby, Wallet, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleEditProfile = () => {
    console.log('Edit profile clicked');
  };

  const handleAvatarClick = () => {
    console.log('Avatar clicked');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header 
        title="Profile" 
        showSettings 
        onSettingsClick={() => console.log('Settings clicked')}
      />
      
      <div className="max-w-md mx-auto">
        <ProfileHeader 
          onAvatarClick={handleAvatarClick}
        />
        
        <ProfileStats 
          posts={0}
          followers={0}
          following={0}
        />
        
        <ProfileBio
          username="your.story"
          displayName="Your Story"
        >
          <div className="flex items-center text-sm text-muted-foreground mb-1 justify-center">
            <MapPin size={14} className="mr-1 text-nuumi-pink" />
            <span>Add your neighborhood</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Add child age • Add dietary needs <span className="text-nuumi-pink ml-1 font-medium">Edit</span>
          </div>
        </ProfileBio>
        
        <ProfileActions
          isCurrentUser={true}
          onEditProfile={handleEditProfile}
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
