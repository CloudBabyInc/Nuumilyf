
import React, { useState } from 'react';
import { Home, Plus, User, ShoppingBag, PlusCircle } from 'lucide-react';
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
    <div className="fixed bottom-0 left-0 right-0 flex flex-col items-center pb-6 pt-2 z-50 pointer-events-none">
      {/* Floating Action Button - Positioned above the navbar */}
      <div className="pointer-events-auto mb-4">
        <ActionButton
          icon={Plus}
          label=""
          onClick={toggleActionMenu}
          className={cn(
            "bg-nuumi-pink text-white shadow-lg transform transition-transform duration-300",
            actionMenuOpen && "rotate-45"
          )}
          variant="primary"
          size="lg"
        />
      </div>
      
      {/* Action Menu Popup */}
      <AnimatePresence>
        {actionMenuOpen && (
          <motion.div 
            className="absolute bottom-24 flex space-x-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <Link 
              to="/marketplace" 
              className="bg-card shadow-lg rounded-full p-3 flex flex-col items-center pointer-events-auto"
              onClick={() => setActionMenuOpen(false)}
            >
              <ShoppingBag className="text-nuumi-pink" size={24} />
              <span className="text-[10px] mt-1 font-medium">Marketplace</span>
            </Link>
            <Link 
              to="/create" 
              className="bg-card shadow-lg rounded-full p-3 flex flex-col items-center pointer-events-auto"
              onClick={() => setActionMenuOpen(false)}
            >
              <PlusCircle className="text-nuumi-pink" size={24} />
              <span className="text-[10px] mt-1 font-medium">Add Post</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="max-w-md w-full mx-auto pointer-events-auto">
        <div className="flex items-center justify-around bg-card/90 backdrop-blur-xl border border-border/40 shadow-lg rounded-full px-8 py-2 animate-slide-up">
          {/* Home button */}
          <NavItem
            key={navItems[0].path}
            icon={navItems[0].icon}
            label={navItems[0].label}
            path={navItems[0].path}
            isActive={activeTab === navItems[0].path}
            onClick={handleSetActiveTab}
          />
          
          {/* Empty div for spacing where action button would be */}
          <div className="w-12" />
          
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
