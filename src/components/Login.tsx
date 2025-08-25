
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2, Phone } from 'lucide-react';

interface LoginProps {
  onToggleMode: () => void;
  isSignupMode: boolean;
}

const Login = ({ onToggleMode, isSignupMode }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [showMFA, setShowMFA] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const { login, signup, mfaError, resolveMFA, clearMfaError, setupRecaptcha, sendEmailVerification, checkEmailVerification, emailVerificationSent } = useAuth();

  useEffect(() => {
    if (mfaError) {
      setShowMFA(true);
      setLoading(false);
      setupRecaptcha('recaptcha-container');
    }
  }, [mfaError, setupRecaptcha]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isSignupMode && password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      
      if (isSignupMode) {
        await signup(email, password);
        setShowEmailVerification(true);
      } else {
        await login(email, password);
      }
    } catch (error: any) {
      if (error.message === 'MFA_REQUIRED') {
        // MFA will be handled by the useEffect hook
        return;
      }
      setError(error.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  }

  async function handleMFASubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await resolveMFA(mfaCode);
      setShowMFA(false);
      setMfaCode('');
    } catch (error: any) {
      setError(error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  }

  function handleBackToLogin() {
    setShowMFA(false);
    setMfaCode('');
    clearMfaError();
    setError('');
  }

  async function handleEmailVerification(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await checkEmailVerification();
      setShowEmailVerification(false);
      // User will be redirected by the auth context after verification
    } catch (error: any) {
      setError(error.message || 'Email not yet verified');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendEmailVerification() {
    try {
      setError('');
      setSendingEmail(true);
      await sendEmailVerification();
    } catch (error: any) {
      setError(error.message || 'Failed to send verification email');
    } finally {
      setSendingEmail(false);
    }
  }

  function handleBackToSignup() {
    setShowEmailVerification(false);
    setError('');
  }

  if (showEmailVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-center">
              {emailVerificationSent 
                ? `We've sent a verification link to ${email}. Please check your email and click the link.`
                : `Please send a verification email to ${email} and then click the link in your email.`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailVerification} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {!emailVerificationSent && (
                <Button 
                  type="button"
                  onClick={handleSendEmailVerification}
                  className="w-full mb-4"
                  disabled={sendingEmail}
                >
                  {sendingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Verification Email
                </Button>
              )}
              
              {emailVerificationSent && (
                <Alert>
                  <AlertDescription>
                    After clicking the verification link in your email, come back here and click the button below.
                  </AlertDescription>
                </Alert>
              )}
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                I've Verified My Email
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={handleBackToSignup}
                disabled={loading}
              >
                Back to Signup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showMFA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <Phone className="h-6 w-6" />
              Phone Verification
            </CardTitle>
            <CardDescription className="text-center">
              Enter the verification code sent to your registered phone number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMFASubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="mfaCode">Verification Code</Label>
                <Input
                  id="mfaCode"
                  type="text"
                  placeholder="123456"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  required
                  disabled={loading}
                  maxLength={6}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || mfaCode.length !== 6}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Code
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={handleBackToLogin}
                disabled={loading}
              >
                Back to Login
              </Button>
            </div>
            <div id="recaptcha-container"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isSignupMode ? 'Create Admin Account' : 'Admin Portal Login'}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignupMode 
              ? 'Sign up for admin access to DegreeSight'
              : 'Sign in to access DegreeSight'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {isSignupMode && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignupMode ? 'Create Account' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">
              {isSignupMode ? 'Already have an account?' : "Don't have an account?"}
            </span>
            <Button
              type="button"
              variant="link"
              className="p-0 ml-1 h-auto font-normal"
              onClick={onToggleMode}
              disabled={loading}
            >
              {isSignupMode ? 'Sign in' : 'Sign up'}
            </Button>
          </div>
          <div id="recaptcha-container" className="hidden"></div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
