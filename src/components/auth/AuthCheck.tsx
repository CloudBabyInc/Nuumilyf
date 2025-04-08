
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface AuthCheckProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const AuthCheck = ({ children, redirectTo = '/auth' }: AuthCheckProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // First set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth check event:', event, !!session);
        setIsAuthenticated(!!session);
        setIsLoading(false);
      }
    );
    
    // Then check the current session
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        console.log('Auth check current session:', !!data.session);
        setIsAuthenticated(!!data.session);
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-nuumi-pink" />
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to', redirectTo);
    return <Navigate to={redirectTo} />;
  }

  console.log('User is authenticated, rendering children');
  return <>{children}</>;
};

export default AuthCheck;
