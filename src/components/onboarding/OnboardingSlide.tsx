
import React from 'react';

interface OnboardingSlideProps {
  title: string;
  description: string;
  emoji?: string;
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({ 
  title, 
  description,
  emoji
}) => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 animate-fade-in bg-background">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          {emoji && <span className="mr-2">{emoji}</span>}
          {title}
        </h1>
        <p className="text-xl text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

export default OnboardingSlide;
