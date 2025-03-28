
import React from 'react';
import Header from '@/components/layout/Header';

const Marketplace = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Marketplace" />
      
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="bg-card rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Marketplace</h2>
          <p className="text-muted-foreground">
            The marketplace feature is coming soon!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
