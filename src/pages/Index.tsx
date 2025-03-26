
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to feed page
    navigate('/feed');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center animate-fade-in">
        <div className="flex flex-col items-center justify-center">
          <img 
            src="/lovable-uploads/3f006055-b9a4-4322-9a83-427e9aa8b18b.png" 
            alt="nuumi - For every mom" 
            className="w-64 md:w-80 max-w-full h-auto mb-4"
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
