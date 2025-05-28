
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageCircle, MoreVertical, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import NotificationCenter from '../notifications/NotificationCenter';
import ActionButton from '../shared/ActionButton';
import { Link } from 'react-router-dom';
import { MotionWrapper, SlideLeft, FadeIn } from '../ui/MotionWrapper';
import { Typography } from '../ui/Typography';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  showSettings?: boolean;
  onSettingsClick?: () => void;
  className?: string;
  rightContent?: React.ReactNode;
}

const Header = ({
  title,
  showBackButton,
  onBackClick,
  showSettings,
  onSettingsClick,
  className,
  rightContent
}: HeaderProps) => {
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      setIsSettingsOpen(!isSettingsOpen);
    }
  };

  return (
    <MotionWrapper
      variant="slideDown"
      duration={0.6}
      as="header"
      className={cn(
        "bg-background/80 backdrop-blur-md sticky top-0 z-10 w-full flex items-center justify-between py-4 px-4",
        "glass-intense border-b border-white/10",
        "seamless-header", // Apply the seamless style
        className
      )}
    >
      <SlideLeft delay={0.1} className="flex items-center">
        {showBackButton && (
          <MotionWrapper
            variant="scaleIn"
            delay={0.2}
            hover={true}
            tap={true}
            as="button"
            onClick={handleBackClick}
            className="mr-3 rounded-full h-10 w-10 flex items-center justify-center btn-elegant glass-button micro-bounce"
          >
            <ChevronLeft className="h-6 w-6" />
          </MotionWrapper>
        )}

        {!showBackButton && (
          <MotionWrapper
            variant="fadeIn"
            delay={0.2}
            hover={true}
            className="mr-3"
          >
            <Link to="/" className="block transition-all duration-300 hover:scale-105">
              <img
                src="/assets/LOGO.png"
                alt="nuumi logo"
                className="h-8 w-auto filter drop-shadow-lg transition-all duration-300 hover:drop-shadow-xl"
              />
            </Link>
          </MotionWrapper>
        )}

        {title && (
          <Typography
            variant="h4"
            weight="semibold"
            animate={true}
            animationVariant="slideLeft"
            delay={0.3}
            className="text-elegant-bold glow-on-hover"
          >
            {title}
          </Typography>
        )}
      </SlideLeft>

      <FadeIn delay={0.4} className="flex items-center space-x-2">
        {rightContent}

        <MotionWrapper
          variant="scaleIn"
          delay={0.5}
          hover={true}
          tap={true}
          className="action-button btn-elegant micro-lift glow-on-hover"
        >
          <Link to="/chats" className="flex items-center justify-center w-full h-full">
            <MessageCircle className="h-5 w-5" />
          </Link>
        </MotionWrapper>

        <MotionWrapper
          variant="scaleIn"
          delay={0.6}
          hover={true}
          tap={true}
        >
          <NotificationCenter className="action-button btn-elegant micro-lift glow-on-hover" />
        </MotionWrapper>

        {showSettings && (
          <MotionWrapper
            variant="scaleIn"
            delay={0.7}
            hover={true}
            tap={true}
            as="button"
            onClick={handleSettingsClick}
            className="action-button btn-elegant micro-lift glow-on-hover"
          >
            {isSettingsOpen ? (
              <MoreVertical className="h-5 w-5" />
            ) : (
              <Settings className="h-5 w-5" />
            )}
          </MotionWrapper>
        )}
      </FadeIn>
    </MotionWrapper>
  );
};

export default Header;
