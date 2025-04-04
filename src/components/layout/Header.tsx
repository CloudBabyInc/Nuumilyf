
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Settings, MessageCircle } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import Avatar from '@/components/shared/Avatar';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackButtonClick?: () => void;
  showSettings?: boolean;
  onSettingsClick?: () => void;
  className?: string;
  actions?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  onBackButtonClick,
  showSettings = false,
  onSettingsClick,
  className = '',
  actions,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useProfile();
  const [session, setSession] = React.useState<any>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleBackClick = () => {
    if (onBackButtonClick) {
      onBackButtonClick();
    } else {
      navigate(-1);
    }
  };

  const handleAvatarClick = () => {
    navigate('/profile');
  };

  const handleMessageClick = () => {
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to view your messages",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }
    navigate('/chats');
  };

  return (
    <header className={`sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-3 ${className}`}>
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center">
          {showBackButton && (
            <button
              onClick={handleBackClick}
              className="mr-3 rounded-full p-1 hover:bg-muted transition-colors"
            >
              <ChevronLeft size={20} className="text-foreground" />
            </button>
          )}
          
          {title && <h1 className="text-lg font-semibold">{title}</h1>}
        </div>

        <div className="flex items-center space-x-1.5">
          {session && (
            <>
              <button
                onClick={handleMessageClick}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <MessageCircle size={18} className="text-foreground" />
              </button>
              
              <NotificationCenter className="p-1.5 rounded-full hover:bg-muted transition-colors" />
            </>
          )}
          
          {showSettings && (
            <button
              onClick={onSettingsClick}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <Settings size={18} className="text-foreground" />
            </button>
          )}
          
          {session && (
            <button onClick={handleAvatarClick} className="ml-1">
              <Avatar
                src={profile?.avatar_url || undefined}
                alt={profile?.display_name || 'User'}
                size="sm"
              />
            </button>
          )}
          
          {actions}
        </div>
      </div>
    </header>
  );
};

export default Header;
