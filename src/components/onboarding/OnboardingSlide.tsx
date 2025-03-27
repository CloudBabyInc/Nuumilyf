
import React from 'react';

interface OnboardingSlideProps {
  title: string;
  description: string;
  emoji?: string;
  imagePath?: string;
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({ 
  title, 
  description,
  emoji,
  imagePath
}) => {
  return (
    <div className="min-h-screen flex flex-col justify-between items-center px-6 animate-fade-in bg-background">
      {/* Image container */}
      {imagePath && (
        <div className="flex-1 w-full flex items-center justify-center pt-12 md:pt-16">
          <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden">
            <img 
              src={imagePath} 
              alt={title}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/90"></div>
          </div>
        </div>
      )}
      
      {/* Text content */}
      <div className="text-center max-w-md mb-32">
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
