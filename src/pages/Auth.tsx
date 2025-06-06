import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PageTransition, FadeIn, SlideUp } from '@/components/ui/MotionWrapper';
import { Typography } from '@/components/ui/Typography';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log('User already has a session, redirecting to feed');
        navigate('/feed');
      }
    };
    checkSession();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        toast.success('Account created successfully! Please check your email for verification.');
        setIsSignUp(false); // Switch to sign in view
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during sign up');
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting to sign in with:', { email });

      // Clear any existing session first to ensure clean login attempt
      await supabase.auth.signOut({ scope: 'local' });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      if (data.user) {
        console.log('Sign in successful:', data.user.id);
        toast.success('Signed in successfully!');
        navigate('/feed');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during sign in');
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetOnboarding = () => {
    localStorage.removeItem('hasShownOnboarding');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex flex-col items-center justify-center p-4">
      <FadeIn delay={0.1} className="w-full max-w-md">
        <SlideUp delay={0.2} className="text-center mb-8">
          <FadeIn delay={0.3}>
            <img
              src="/assets/LOGO.png"
              alt="nuumi - For every mom"
              className="h-16 mx-auto mb-4 filter drop-shadow-lg"
            />
          </FadeIn>
          <Typography
            variant="h2"
            weight="bold"
            animate={true}
            animationVariant="slideUp"
            delay={0.4}
            className="text-elegant-bold mb-2"
          >
            {isSignUp ? 'Create Your Account' : 'Welcome Back'}
          </Typography>
          <Typography
            variant="body"
            animate={true}
            animationVariant="fadeIn"
            delay={0.5}
            className="text-muted-foreground text-elegant"
          >
            {isSignUp ? 'Join the community of moms' : 'Sign in to connect with other moms'}
          </Typography>
        </SlideUp>

        <SlideUp delay={0.6} className="glass-card bg-card/80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="yourusername"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Your Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              {!isSignUp && (
                <div className="text-right">
                  <button
                    type="button"
                    className="text-xs text-nuumi-pink hover:underline"
                    onClick={() => navigate('/forgot-password')}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-nuumi-pink hover:bg-nuumi-pink/90"
              disabled={loading}
            >
              {loading
                ? 'Loading...'
                : isSignUp
                ? 'Create Account'
                : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isSignUp
                ? 'Already have an account?'
                : 'Don\'t have an account?'}
              {' '}
              <button
                type="button"
                className="text-nuumi-pink hover:underline font-medium"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>

            <p className="mt-4 text-xs text-muted-foreground">
              <button
                type="button"
                className="text-blue-500 hover:underline"
                onClick={resetOnboarding}
              >
                See onboarding again
              </button>
            </p>
          </div>
        </SlideUp>
      </FadeIn>
    </div>
  );
};

export default Auth;
