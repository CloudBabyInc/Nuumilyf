
import React from 'react';

interface OnboardingSlideProps {
  image: string;
  title: string;
  description: string;
  emoji?: string;
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({ 
  image, 
  title, 
  description,
  emoji
}) => {
  return (
    <div 
      className="min-h-screen flex flex-col justify-center px-6 animate-fade-in"
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="mt-auto mb-60">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {emoji && <span className="mr-2">{emoji}</span>}
          {title}
        </h1>
        <p className="text-xl text-gray-600">{description}</p>
      </div>
    </div>
  );
};

export default OnboardingSlide;
