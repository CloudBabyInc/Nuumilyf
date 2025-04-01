
import React, { useState } from 'react';
import { Home, Plus, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ActionButton from '../shared/ActionButton';

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
    className="flex flex-col items-center justify-center relative" 
    onClick={() => onClick(path)}
  >
    <div className={cn(
      "relative flex items-center justify-center transition-all duration-300",
      isActive ? "text-nuumi-pink scale-105" : "text-muted-foreground scale-100 hover:text-foreground/80"
    )}>
      {isActive && (
        <motion.div 
          layoutId="navIndicator"
          className="absolute inset-0 bg-nuumi-pink/10 rounded-full -m-1.5 w-8 h-8"
          initial={false}
          transition={{ type: "spring", duration: 0.5 }}
        />
      )}
      <Icon 
        size={20} 
        strokeWidth={isActive ? 2.5 : 2}
        className={cn(
          "transition-all duration-300",
          isActive && "drop-shadow-[0_0_2px_rgba(255,105,180,0.6)]"
        )}
      />
    </div>
    <span className={cn(
      "text-[9px] mt-0.5 font-medium transition-all",
      isActive ? "opacity-100 text-nuumi-pink" : "opacity-70"
    )}>
      {label}
    </span>
  </Link>
);

const Navbar = () => {
  // Use this for non-router environments or fallback to '/' when not in a Router context
  const [activeTab, setActiveTab] = useState('/feed');
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  
  // Define navItems with home and profile only
  const navItems = [
    { icon: Home, label: 'Home', path: '/feed' },
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
    <div className="fixed bottom-0 left-0 right-0 flex flex-col items-center pb-1 z-50 pointer-events-none">
      {/* Action Menu Popup */}
      <AnimatePresence>
        {actionMenuOpen && (
          <motion.div 
            className="absolute bottom-16 flex space-x-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <Link 
              to="/marketplace" 
              className="bg-card shadow-lg rounded-full p-2 flex flex-col items-center pointer-events-auto"
              onClick={() => setActionMenuOpen(false)}
            >
              <div className="bg-card shadow-inner p-1.5 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-nuumi-pink">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                  <path d="M3 6h18"></path>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </div>
              <span className="text-[9px] mt-0.5 font-medium">Marketplace</span>
            </Link>
            <Link 
              to="/create" 
              className="bg-card shadow-lg rounded-full p-2 flex flex-col items-center pointer-events-auto"
              onClick={() => setActionMenuOpen(false)}
            >
              <div className="bg-card shadow-inner p-1.5 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-nuumi-pink">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 8v8"></path>
                  <path d="M8 12h8"></path>
                </svg>
              </div>
              <span className="text-[9px] mt-0.5 font-medium">Add Post</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="max-w-md w-full mx-auto pointer-events-auto">
        <div className="relative flex items-center justify-around bg-card/90 backdrop-blur-xl border border-border/40 shadow-lg rounded-full px-6 py-2">
          {/* Home button */}
          <NavItem
            key={navItems[0].path}
            icon={navItems[0].icon}
            label={navItems[0].label}
            path={navItems[0].path}
            isActive={activeTab === navItems[0].path}
            onClick={handleSetActiveTab}
          />
          
          {/* Center Action Button with Groove */}
          <div className="relative -mt-4 px-3">
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-card rounded-full border border-border/40 -z-10"></div>
            <ActionButton
              icon={Plus}
              label=""
              onClick={toggleActionMenu}
              className={cn(
                "bg-nuumi-pink text-white shadow-md transform transition-transform duration-300",
                actionMenuOpen && "rotate-45"
              )}
              variant="primary"
              size="md"
            />
          </div>
          
          {/* Profile button */}
          <NavItem
            key={navItems[1].path}
            icon={navItems[1].icon}
            label={navItems[1].label}
            path={navItems[1].path}
            isActive={activeTab === navItems[1].path}
            onClick={handleSetActiveTab}
          />
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
