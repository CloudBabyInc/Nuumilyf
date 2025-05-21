import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/glassmorphism.css';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'base' | 'intense' | 'gradient' | 'card' | 'glow';
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ 
  children, 
  className = '', 
  variant = 'base' 
}) => {
  const baseClass = variant === 'base' ? 'glass' : 
                   variant === 'intense' ? 'glass-intense' : 
                   variant === 'gradient' ? 'glass-gradient' : 
                   variant === 'card' ? 'glass-card' : 
                   'glass-glow';
  
  return (
    <div className={`${baseClass} ${className}`}>
      {children}
    </div>
  );
};

interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({ 
  children, 
  onClick, 
  className = '',
  disabled = false
}) => {
  return (
    <motion.button
      className={`glass-button ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
};

interface GlassCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  glowEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  title, 
  children, 
  className = '',
  glowEffect = false
}) => {
  return (
    <motion.div
      className={`${glowEffect ? 'glass-glow' : 'glass-card'} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {title && <h3 className="text-xl font-semibold mb-4">{title}</h3>}
      {children}
    </motion.div>
  );
};

interface GlassInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  className?: string;
}

export const GlassInput: React.FC<GlassInputProps> = ({ 
  placeholder, 
  value, 
  onChange, 
  type = 'text',
  className = ''
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`glass-input w-full ${className}`}
    />
  );
};

interface GlassIconProps {
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const GlassIcon: React.FC<GlassIconProps> = ({ 
  icon, 
  onClick, 
  className = '',
  size = 'md'
}) => {
  const sizeClass = 
    size === 'sm' ? 'w-8 h-8 text-sm' : 
    size === 'lg' ? 'w-16 h-16 text-xl' : 
    'w-12 h-12 text-base';
  
  return (
    <motion.div
      className={`glass-intense flex items-center justify-center rounded-full cursor-pointer ${sizeClass} ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {icon}
    </motion.div>
  );
};

interface GlassContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassContainer: React.FC<GlassContainerProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`glass-container ${className}`}>
      {children}
    </div>
  );
};

// Example usage component
export const GlassmorphicUI: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 via-pink-600 to-red-500 p-8 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-white mb-12">Glassmorphic UI Components</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
        <GlassCard title="Basic Glass Card">
          <p className="text-white/80">This is a basic glass card with subtle blur effect and transparency.</p>
          <div className="mt-4">
            <GlassButton>Click Me</GlassButton>
          </div>
        </GlassCard>
        
        <GlassCard title="Glass Card with Input" glowEffect={true}>
          <p className="text-white/80 mb-4">This card has a glow effect and contains a glass input.</p>
          <GlassInput placeholder="Type something..." />
        </GlassCard>
        
        <GlassContainer className="flex flex-col items-center justify-center">
          <h3 className="text-xl font-semibold mb-4 text-white">Glass Icons</h3>
          <div className="flex space-x-4">
            <GlassIcon icon={<span>🔍</span>} size="sm" />
            <GlassIcon icon={<span>🔔</span>} />
            <GlassIcon icon={<span>⚙️</span>} size="lg" />
          </div>
        </GlassContainer>
        
        <GlassPanel variant="gradient" className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-white">Gradient Glass Panel</h3>
          <p className="text-white/80">This panel has a gradient effect with a subtle shimmer animation.</p>
        </GlassPanel>
        
        <GlassPanel variant="intense" className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-white">Intense Glass Panel</h3>
          <p className="text-white/80">This panel has a more intense blur and deeper glass effect.</p>
        </GlassPanel>
        
        <GlassPanel variant="glow" className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-white">Glowing Glass Panel</h3>
          <p className="text-white/80">This panel has a subtle inner glow effect.</p>
        </GlassPanel>
      </div>
    </div>
  );
};

export default GlassmorphicUI;
