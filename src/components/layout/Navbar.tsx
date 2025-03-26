
import React, { useState } from 'react';
import { Home, User, PlusCircle, MessageCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname);

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: MessageCircle, label: 'Chats', path: '/chats' },
    { icon: PlusCircle, label: 'Create', path: '/create' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  React.useEffect(() => {
    setActiveTab(location.pathname);
  }, [location.pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/70 backdrop-blur-xl border-t border-border z-50 px-2 pb-2 pt-2 animate-slide-up">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around bg-muted rounded-full p-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-4 rounded-full transition-all duration-300",
                  isActive ? "text-nuumi-pink" : "text-muted-foreground"
                )}
                onClick={() => setActiveTab(item.path)}
              >
                <div className={cn(
                  "relative flex items-center justify-center transition-transform duration-300",
                  isActive ? "scale-110" : "scale-100"
                )}>
                  <Icon size={24} />
                  {item.path === '/create' && (
                    <div className="absolute inset-0 bg-nuumi-pink rounded-full blur-md opacity-20 animate-pulse"></div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
