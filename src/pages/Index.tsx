
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
        <h1 className="text-5xl font-bold mb-4 text-nuumi-pink">nuumi</h1>
        <p className="text-xl text-muted-foreground">...For every mom</p>
      </div>
    </div>
  );
};

export default Index;
