
import React, { useState } from 'react';
import { Home, MessageCircle, PlusCircle, User, BookOpen, MessageSquareHeart, ShoppingBag } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  isActive: boolean;
  onClick: (path: string) => void;
}

const NavItem = ({ icon: Icon, label, path, isActive, onClick }: NavItemProps) => (
  <Link
    to={path}
    className="flex flex-col items-center justify-center relative px-4"
    onClick={() => onClick(path)}
  >
    <div className={cn(
      "relative flex items-center justify-center transition-all duration-300",
      isActive ? "text-nuumi-pink scale-110" : "text-muted-foreground scale-100 hover:text-foreground/80"
    )}>
      {isActive && (
        <motion.div 
          layoutId="navIndicator"
          className="absolute inset-0 bg-nuumi-pink/10 rounded-full -m-2 w-10 h-10"
          initial={false}
          transition={{ type: "spring", duration: 0.5 }}
        />
      )}
      <Icon 
        size={24} 
        strokeWidth={isActive ? 2.5 : 2}
        className={cn(
          "transition-all duration-300",
          isActive && "drop-shadow-[0_0_3px_rgba(255,105,180,0.6)]"
        )}
      />
    </div>
    <span className={cn(
      "text-[10px] mt-1 font-medium transition-all",
      isActive ? "opacity-100 text-nuumi-pink" : "opacity-70"
    )}>
      {label}
    </span>
  </Link>
);

const Navbar = () => {
  // Use this for non-router environments or fallback to '/' when not in a Router context
  const [activeTab, setActiveTab] = useState('/');
  
  // Define navItems
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: MessageSquareHeart, label: 'Chats', path: '/chats' },
    { icon: ShoppingBag, label: 'Create', path: '/create' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  // Handle active tab setting
  const handleSetActiveTab = (path: string) => {
    setActiveTab(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-6 pt-2 z-50 pointer-events-none">
      <nav className="max-w-xs mx-auto pointer-events-auto">
        <div className="flex items-center justify-around bg-card/90 backdrop-blur-xl border border-border/40 shadow-lg rounded-full px-3 py-2 animate-slide-up">
          {navItems.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              isActive={activeTab === item.path}
              onClick={handleSetActiveTab}
            />
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
