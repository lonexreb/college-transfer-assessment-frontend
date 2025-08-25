
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/contexts/AuthContext';
import { Phone, Shield, Loader2 } from 'lucide-react';
import { ConfirmationResult } from 'firebase/auth';

const MFASetup = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'email' | 'phone' | 'verify'>('email');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const { currentUser, setupMFA, verifyMFASetup, setupRecaptcha, sendEmailVerification, checkEmailVerification } = useAuth();

  useEffect(() => {
    setupRecaptcha('mfa-recaptcha-container');
    
    // Check if email is already verified
    if (currentUser?.emailVerified) {
      setStep('phone');
    }
  }, [setupRecaptcha, currentUser]);

  async function handleSendEmailVerification(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      
      await sendEmailVerification();
      setEmailVerificationSent(true);
    } catch (error: any) {
      setError(error.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckEmailVerification(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      
      await checkEmailVerification();
      setStep('phone');
    } catch (error: any) {
      setError(error.message || 'Email not yet verified');
    } finally {
      setLoading(false);
    }
  }

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      
      const result = await setupMFA(phoneNumber);
      setConfirmationResult(result);
      setStep('verify');
    } catch (error: any) {
      setError(error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!confirmationResult) return;
    
    try {
      setError('');
      setLoading(true);
      
      await verifyMFASetup(verificationCode, confirmationResult);
      setSuccess(true);
    } catch (error: any) {
      setError(error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  }

  function resetSetup() {
    setStep(currentUser?.emailVerified ? 'phone' : 'email');
    setPhoneNumber('');
    setVerificationCode('');
    setConfirmationResult(null);
    setError('');
    setSuccess(false);
    setEmailVerificationSent(false);
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-xl">MFA Setup Complete!</CardTitle>
          <CardDescription>
            Your phone number has been successfully added as a second factor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={resetSetup} className="w-full">
            Setup Another Number
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
          <Phone className="h-6 w-6" />
          Setup Two-Factor Authentication
        </CardTitle>
        <CardDescription className="text-center">
          {step === 'email' 
            ? 'First, verify your email address to enable multi-factor authentication'
            : step === 'phone' 
            ? 'Add your phone number for additional security'
            : 'Enter the verification code sent to your phone'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'email' ? (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {emailVerificationSent ? (
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Verification email sent to {currentUser?.email}. Please check your email and click the verification link.
                  </AlertDescription>
                </Alert>
                
                <form onSubmit={handleCheckEmailVerification} className="space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    I've Verified My Email
                  </Button>
                </form>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setEmailVerificationSent(false)}
                  disabled={loading}
                >
                  Resend Verification Email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSendEmailVerification} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="p-3 bg-muted rounded-md">
                    {currentUser?.email || 'No email found'}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We'll send a verification link to this email address.
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Verification Email
                </Button>
              </form>
            )}
          </div>
        ) : step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Include country code (e.g., +1 for US)
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !phoneNumber}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Verification Code
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="verificationCode">Verification Code</Label>
              <Input
                id="verificationCode"
                type="text"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
                disabled={loading}
                maxLength={6}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || verificationCode.length !== 6}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify & Enable MFA
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={resetSetup}
              disabled={loading}
            >
              Use Different Number
            </Button>
          </form>
        )}
        
        <div id="mfa-recaptcha-container" className="mt-4"></div>
      </CardContent>
    </Card>
  );
};

export default MFASetup;
