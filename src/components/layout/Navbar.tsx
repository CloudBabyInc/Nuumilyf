
import React, { useState } from 'react';
import { Home, MessageSquareHeart, Plus, User, ShoppingBag, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
    className="flex flex-col items-center justify-center relative px-10" // Wide spacing for tabs
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

const ActionButton = ({ onClick, isActive, isOpen }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center relative px-10"
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
      <Plus 
        size={24} 
        strokeWidth={isActive ? 2.5 : 2}
        className={cn(
          "transition-all duration-300 transform",
          isOpen && "rotate-45",
          isActive && "drop-shadow-[0_0_3px_rgba(255,105,180,0.6)]"
        )}
      />
    </div>
    <span className={cn(
      "text-[10px] mt-1 font-medium transition-all",
      isActive ? "opacity-100 text-nuumi-pink" : "opacity-70"
    )}>
      Create
    </span>
  </button>
);

const Navbar = () => {
  // Use this for non-router environments or fallback to '/' when not in a Router context
  const [activeTab, setActiveTab] = useState('/');
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  
  // Define navItems with correct order - Home, Plus button, Chats, Profile
  const navItems = [
    { icon: Home, label: 'Home', path: '/feed' },
    { icon: MessageSquareHeart, label: 'Chats', path: '/chats' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  // Handle active tab setting
  const handleSetActiveTab = (path: string) => {
    setActiveTab(path);
    // Close action menu when navigating
    setActionMenuOpen(false);
  };

  // Toggle action menu
  const toggleActionMenu = () => {
    setActionMenuOpen(!actionMenuOpen);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-6 pt-2 z-50 pointer-events-none">
      <nav className="max-w-md w-full mx-auto pointer-events-auto">
        {/* Action Menu Popup */}
        <AnimatePresence>
          {actionMenuOpen && (
            <motion.div 
              className="absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 flex space-x-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <Link 
                to="/marketplace" 
                className="bg-card shadow-lg rounded-full p-3 flex flex-col items-center"
                onClick={() => setActionMenuOpen(false)}
              >
                <ShoppingBag className="text-nuumi-pink" size={24} />
                <span className="text-[10px] mt-1 font-medium">Marketplace</span>
              </Link>
              <Link 
                to="/create" 
                className="bg-card shadow-lg rounded-full p-3 flex flex-col items-center"
                onClick={() => setActionMenuOpen(false)}
              >
                <PlusCircle className="text-nuumi-pink" size={24} />
                <span className="text-[10px] mt-1 font-medium">Add Post</span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-around bg-card/90 backdrop-blur-xl border border-border/40 shadow-lg rounded-full px-3 py-2 animate-slide-up">
          {/* Home button */}
          <NavItem
            key={navItems[0].path}
            icon={navItems[0].icon}
            label={navItems[0].label}
            path={navItems[0].path}
            isActive={activeTab === navItems[0].path}
            onClick={handleSetActiveTab}
          />
          
          {/* Action Button in the Middle */}
          <ActionButton 
            onClick={toggleActionMenu} 
            isActive={activeTab === '/create'} 
            isOpen={actionMenuOpen}
          />
          
          {/* Chat and Profile buttons */}
          {navItems.slice(1).map((item) => (
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
