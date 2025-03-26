
import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isActive?: boolean;
  count?: number;
}

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  className,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  isActive = false,
  count
}: ActionButtonProps) => {
  const variantClasses = {
    default: 'bg-card hover:bg-secondary text-foreground',
    primary: 'bg-nuumi-pink text-white hover:bg-nuumi-pink/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'bg-transparent hover:bg-secondary/30 text-foreground'
  };

  const sizeClasses = {
    sm: 'text-xs px-3 py-2 space-x-1',
    md: 'text-sm px-4 py-2 space-x-2',
    lg: 'text-base px-5 py-3 space-x-3'
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22
  };

  return (
    <button
      className={cn(
        'rounded-xl flex items-center justify-center transition-all duration-200 font-medium',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        isActive && 'ring-2 ring-nuumi-pink',
        className
      )}
      onClick={onClick}
    >
      <Icon size={iconSizes[size]} className={isActive ? 'text-nuumi-pink' : ''} />
      <span>{label}</span>
      {count !== undefined && (
        <span className="ml-1 text-xs bg-nuumi-pink text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
          {count}
        </span>
      )}
    </button>
  );
};

export default ActionButton;
