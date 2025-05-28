import React from 'react';
import { cn } from '@/lib/utils';
import { MotionWrapper } from './MotionWrapper';

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption' | 'overline' | 'subtitle1' | 'subtitle2';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  italic?: boolean;
  shimmer?: boolean;
  elegant?: boolean;
  animate?: boolean;
  animationVariant?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'scaleIn';
  delay?: number;
  as?: keyof JSX.IntrinsicElements;
}

const variantStyles = {
  h1: 'text-4xl md:text-5xl lg:text-6xl font-caslon-bold leading-tight tracking-tight',
  h2: 'text-3xl md:text-4xl lg:text-5xl font-caslon-semibold leading-tight tracking-tight',
  h3: 'text-2xl md:text-3xl lg:text-4xl font-caslon-semibold leading-snug tracking-normal',
  h4: 'text-xl md:text-2xl lg:text-3xl font-caslon-medium leading-snug tracking-normal',
  h5: 'text-lg md:text-xl lg:text-2xl font-caslon-medium leading-normal tracking-normal',
  h6: 'text-base md:text-lg lg:text-xl font-caslon-medium leading-normal tracking-normal',
  body: 'text-base font-caslon-regular leading-relaxed tracking-normal',
  subtitle1: 'text-lg font-caslon-medium leading-normal tracking-normal',
  subtitle2: 'text-base font-caslon-medium leading-normal tracking-normal',
  caption: 'text-sm font-caslon-regular leading-normal tracking-normal',
  overline: 'text-xs font-caslon-medium leading-normal tracking-wide uppercase',
};

const weightStyles = {
  regular: 'font-caslon-regular',
  medium: 'font-caslon-medium',
  semibold: 'font-caslon-semibold',
  bold: 'font-caslon-bold',
};

export const Typography: React.FC<TypographyProps> = ({
  children,
  className,
  variant = 'body',
  weight,
  italic = false,
  shimmer = false,
  elegant = true,
  animate = false,
  animationVariant = 'fadeIn',
  delay = 0,
  as,
}) => {
  // Determine the HTML element to use
  const Component = as || (variant.startsWith('h') ? variant : 'p') as keyof JSX.IntrinsicElements;
  
  // Build the className
  const baseClasses = variantStyles[variant];
  const weightClass = weight ? weightStyles[weight] : '';
  const italicClass = italic ? 'font-caslon-italic' : '';
  const shimmerClass = shimmer ? 'text-shimmer' : '';
  const elegantClass = elegant ? 'text-elegant' : '';
  
  const combinedClassName = cn(
    baseClasses,
    weightClass,
    italicClass,
    shimmerClass,
    elegantClass,
    className
  );

  const content = (
    <Component className={combinedClassName}>
      {children}
    </Component>
  );

  // Wrap with animation if requested
  if (animate) {
    return (
      <MotionWrapper 
        variant={animationVariant} 
        delay={delay}
        as={Component as any}
        className={combinedClassName}
      >
        {children}
      </MotionWrapper>
    );
  }

  return content;
};

// Specialized typography components
export const Heading1: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography {...props} variant="h1" />
);

export const Heading2: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography {...props} variant="h2" />
);

export const Heading3: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography {...props} variant="h3" />
);

export const Heading4: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography {...props} variant="h4" />
);

export const Heading5: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography {...props} variant="h5" />
);

export const Heading6: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography {...props} variant="h6" />
);

export const BodyText: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography {...props} variant="body" />
);

export const Subtitle1: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography {...props} variant="subtitle1" />
);

export const Subtitle2: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography {...props} variant="subtitle2" />
);

export const Caption: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography {...props} variant="caption" />
);

export const Overline: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography {...props} variant="overline" />
);

// Special effect components
export const ShimmerText: React.FC<Omit<TypographyProps, 'shimmer'>> = (props) => (
  <Typography {...props} shimmer={true} />
);

export const AnimatedHeading: React.FC<Omit<TypographyProps, 'animate'>> = (props) => (
  <Typography {...props} animate={true} />
);

// Hero text component with enhanced styling
export const HeroText: React.FC<{
  children: React.ReactNode;
  className?: string;
  shimmer?: boolean;
  animate?: boolean;
}> = ({ children, className, shimmer = false, animate = true }) => (
  <Typography
    variant="h1"
    weight="bold"
    shimmer={shimmer}
    animate={animate}
    animationVariant="slideUp"
    className={cn(
      'text-center bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent',
      'drop-shadow-lg',
      className
    )}
  >
    {children}
  </Typography>
);

// Quote component with elegant styling
export const Quote: React.FC<{
  children: React.ReactNode;
  author?: string;
  className?: string;
}> = ({ children, author, className }) => (
  <div className={cn('space-y-4', className)}>
    <Typography
      variant="subtitle1"
      italic={true}
      className="text-muted-foreground border-l-4 border-primary pl-6 py-2"
    >
      "{children}"
    </Typography>
    {author && (
      <Typography
        variant="caption"
        weight="medium"
        className="text-right text-muted-foreground"
      >
        — {author}
      </Typography>
    )}
  </div>
);

// Display text for large impact
export const DisplayText: React.FC<{
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}> = ({ children, className, gradient = false }) => (
  <Typography
    variant="h1"
    weight="bold"
    className={cn(
      'text-5xl md:text-6xl lg:text-7xl xl:text-8xl',
      gradient && 'bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent',
      className
    )}
  >
    {children}
  </Typography>
);

export default Typography;
