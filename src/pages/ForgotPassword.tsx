
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FadeIn, SlideUp } from '@/components/ui/MotionWrapper';
import { Typography } from '@/components/ui/Typography';

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSent(true);
      toast.success('Password reset link sent! Please check your email.');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while sending the reset link');
      console.error('Reset password error:', error);
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
            Reset Your Password
          </Typography>
          <Typography
            variant="body"
            animate={true}
            animationVariant="fadeIn"
            delay={0.5}
            className="text-muted-foreground text-elegant"
          >
            {sent
              ? "Check your email for the password reset link"
              : "Enter your email and we'll send you a password reset link"}
          </Typography>
        </SlideUp>

        <SlideUp delay={0.6} className="glass-card bg-card/80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
          {sent ? (
            <div className="text-center space-y-4">
              <p>We've sent a password reset link to <strong>{email}</strong></p>
              <p className="text-sm text-muted-foreground">
                If you don't see it in your inbox, please check your spam folder.
              </p>
              <Button
                className="w-full bg-nuumi-pink hover:bg-nuumi-pink/90 mt-4"
                onClick={() => navigate('/auth')}
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
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

              <Button
                type="submit"
                className="w-full bg-nuumi-pink hover:bg-nuumi-pink/90"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  className="text-sm text-nuumi-pink hover:underline"
                  onClick={() => navigate('/auth')}
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </SlideUp>
      </FadeIn>
    </div>
  );
};

export default ForgotPassword;
