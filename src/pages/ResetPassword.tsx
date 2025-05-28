
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FadeIn, SlideUp } from '@/components/ui/MotionWrapper';
import { Typography } from '@/components/ui/Typography';

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  // Check if we have a "recovered" event when coming from reset password email
  useEffect(() => {
    const checkHashParams = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
        // Hash includes recovery token
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          toast.error("Your password reset link has expired or is invalid");
          navigate('/auth');
        } else if (!data.session) {
          toast.error("Your password reset link has expired or is invalid");
          navigate('/auth');
        }
      } else {
        // No recovery token in URL, redirect to forgot password
        navigate('/forgot-password');
      }
    };

    checkHashParams();
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast.success('Password has been reset successfully!');

      // Sign the user out and redirect to login
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while resetting your password');
      console.error('Update password error:', error);
    } finally {
      setLoading(false);
    }
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
            Set New Password
          </Typography>
          <Typography
            variant="body"
            animate={true}
            animationVariant="fadeIn"
            delay={0.5}
            className="text-muted-foreground text-elegant"
          >
            Create a new password for your account
          </Typography>
        </SlideUp>

        <SlideUp delay={0.6} className="glass-card bg-card/80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-nuumi-pink hover:bg-nuumi-pink/90"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </SlideUp>
      </FadeIn>
    </div>
  );
};

export default ResetPassword;
