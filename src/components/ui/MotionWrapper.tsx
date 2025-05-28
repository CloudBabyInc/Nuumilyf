import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MotionWrapperProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scaleIn' | 'bounceIn' | 'stagger' | 'float' | 'glow';
  delay?: number;
  duration?: number;
  staggerChildren?: number;
  hover?: boolean;
  tap?: boolean;
  whileInView?: boolean;
  once?: boolean;
  as?: keyof typeof motion;
}

// Enhanced animation variants with sophisticated blur effects
const variants: Record<string, Variants> = {
  fadeIn: {
    hidden: {
      opacity: 0,
      y: 8,
      filter: "blur(4px)"
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  },
  slideUp: {
    hidden: {
      opacity: 0,
      y: 20,
      filter: "blur(6px)"
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.9,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  },
  slideDown: {
    hidden: {
      opacity: 0,
      y: -20,
      filter: "blur(6px)"
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.9,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  },
  slideLeft: {
    hidden: {
      opacity: 0,
      x: 25,
      filter: "blur(5px)"
    },
    visible: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  },
  slideRight: {
    hidden: {
      opacity: 0,
      x: -25,
      filter: "blur(5px)"
    },
    visible: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  },
  scaleIn: {
    hidden: {
      opacity: 0,
      scale: 0.95,
      filter: "blur(3px)"
    },
    visible: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  },
  bounceIn: {
    hidden: {
      opacity: 0,
      scale: 0.9,
      filter: "blur(4px)"
    },
    visible: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  },
  stagger: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  },
  float: {
    hidden: {
      y: 0,
      filter: "blur(0px)"
    },
    visible: {
      y: [-2, 2, -2],
      filter: "blur(0px)",
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },
  glow: {
    hidden: {
      boxShadow: "0 0 0px rgba(233, 75, 157, 0)",
      filter: "blur(0px)"
    },
    visible: {
      boxShadow: [
        "0 0 0px rgba(233, 75, 157, 0)",
        "0 0 15px rgba(233, 75, 157, 0.4)",
        "0 0 0px rgba(233, 75, 157, 0)"
      ],
      filter: "blur(0px)",
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }
};

// Sophisticated hover and tap animations with blur
const hoverAnimation = {
  scale: 1.01,
  y: -1,
  filter: "blur(0px) brightness(1.05)",
  transition: {
    duration: 0.3,
    ease: [0.25, 0.46, 0.45, 0.94]
  }
};

const tapAnimation = {
  scale: 0.99,
  filter: "blur(0px) brightness(0.95)",
  transition: {
    duration: 0.15,
    ease: [0.25, 0.46, 0.45, 0.94]
  }
};

export const MotionWrapper: React.FC<MotionWrapperProps> = ({
  children,
  className,
  variant = 'fadeIn',
  delay = 0,
  duration,
  staggerChildren,
  hover = false,
  tap = false,
  whileInView = false,
  once = true,
  as = 'div'
}) => {
  const MotionComponent = motion[as] as any;

  const selectedVariant = variants[variant];

  // Override duration if provided
  if (duration && selectedVariant.visible?.transition) {
    selectedVariant.visible.transition.duration = duration;
  }

  // Override stagger if provided
  if (staggerChildren && selectedVariant.visible?.transition) {
    selectedVariant.visible.transition.staggerChildren = staggerChildren;
  }

  // Add delay if provided
  if (delay && selectedVariant.visible?.transition) {
    selectedVariant.visible.transition.delay = delay;
  }

  const motionProps: any = {
    className: cn(className),
    variants: selectedVariant,
    initial: "hidden",
    animate: whileInView ? undefined : "visible",
    whileInView: whileInView ? "visible" : undefined,
    viewport: whileInView ? { once, amount: 0.1 } : undefined,
    whileHover: hover ? hoverAnimation : undefined,
    whileTap: tap ? tapAnimation : undefined,
  };

  return (
    <MotionComponent {...motionProps}>
      {children}
    </MotionComponent>
  );
};

// Specialized components for common use cases
export const FadeIn: React.FC<Omit<MotionWrapperProps, 'variant'>> = (props) => (
  <MotionWrapper {...props} variant="fadeIn" />
);

export const SlideUp: React.FC<Omit<MotionWrapperProps, 'variant'>> = (props) => (
  <MotionWrapper {...props} variant="slideUp" />
);

export const SlideLeft: React.FC<Omit<MotionWrapperProps, 'variant'>> = (props) => (
  <MotionWrapper {...props} variant="slideLeft" />
);

export const ScaleIn: React.FC<Omit<MotionWrapperProps, 'variant'>> = (props) => (
  <MotionWrapper {...props} variant="scaleIn" />
);

export const BounceIn: React.FC<Omit<MotionWrapperProps, 'variant'>> = (props) => (
  <MotionWrapper {...props} variant="bounceIn" />
);

export const StaggerContainer: React.FC<Omit<MotionWrapperProps, 'variant'>> = (props) => (
  <MotionWrapper {...props} variant="stagger" />
);

export const FloatElement: React.FC<Omit<MotionWrapperProps, 'variant'>> = (props) => (
  <MotionWrapper {...props} variant="float" />
);

export const GlowElement: React.FC<Omit<MotionWrapperProps, 'variant'>> = (props) => (
  <MotionWrapper {...props} variant="glow" />
);

// Page transition wrapper with sophisticated blur
export const PageTransition: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <motion.div
    className={cn("page-transition", className)}
    initial={{
      opacity: 0,
      y: 15,
      filter: "blur(8px)"
    }}
    animate={{
      opacity: 1,
      y: 0,
      filter: "blur(0px)"
    }}
    exit={{
      opacity: 0,
      y: -15,
      filter: "blur(6px)"
    }}
    transition={{
      duration: 0.7,
      ease: [0.25, 0.46, 0.45, 0.94]
    }}
  >
    {children}
  </motion.div>
);

// Stagger children wrapper
export const StaggerChildren: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}> = ({ children, className, staggerDelay = 0.1 }) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: 0.1
        }
      }
    }}
  >
    {React.Children.map(children, (child, index) => (
      <motion.div
        key={index}
        variants={{
          hidden: {
            opacity: 0,
            y: 15,
            filter: "blur(4px)"
          },
          visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: {
              duration: 0.7,
              ease: [0.25, 0.46, 0.45, 0.94]
            }
          }
        }}
        className="stagger-item"
      >
        {child}
      </motion.div>
    ))}
  </motion.div>
);

export default MotionWrapper;
