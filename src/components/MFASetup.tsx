
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
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { currentUser, setupMFA, verifyMFASetup, setupRecaptcha } = useAuth();

  useEffect(() => {
    setupRecaptcha('mfa-recaptcha-container');
  }, [setupRecaptcha]);

  

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      
      // Ensure phone number has proper format
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber}`;
      
      const result = await setupMFA(formattedPhone);
      setConfirmationResult(result);
      setStep('verify');
    } catch (error: any) {
      console.error('MFA setup error:', error);
      if (error.message.includes('email address')) {
        setError('Please verify your email address before setting up MFA');
      } else if (error.message.includes('reCAPTCHA')) {
        setError('Please complete the reCAPTCHA verification');
      } else {
        setError(error.message || 'Failed to send verification code');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!confirmationResult) {
      setError('No verification in progress');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      await verifyMFASetup(verificationCode, confirmationResult);
      setSuccess(true);
    } catch (error: any) {
      console.error('MFA verification error:', error);
      if (error.message.includes('invalid-verification-code')) {
        setError('Invalid verification code. Please try again.');
      } else if (error.message.includes('code-expired')) {
        setError('Verification code has expired. Please request a new one.');
      } else {
        setError(error.message || 'Invalid verification code');
      }
    } finally {
      setLoading(false);
    }
  }

  function resetSetup() {
    setStep('phone');
    setPhoneNumber('');
    setVerificationCode('');
    setConfirmationResult(null);
    setError('');
    setSuccess(false);
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
          {step === 'phone' 
            ? 'Add your phone number for additional security'
            : 'Enter the verification code sent to your phone'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'phone' ? (
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
