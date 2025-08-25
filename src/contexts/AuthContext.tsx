
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  AuthError,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  PhoneAuthProvider,
  linkWithCredential,
  multiFactor,
  PhoneMultiFactorGenerator,
  MultiFactorError,
  sendEmailVerification,
  reload
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  mfaError: MultiFactorError | null;
  setupMFA: (phoneNumber: string) => Promise<ConfirmationResult>;
  verifyMFASetup: (verificationCode: string, confirmationResult: ConfirmationResult) => Promise<void>;
  resolveMFA: (verificationCode: string) => Promise<void>;
  setupRecaptcha: (elementId: string) => void;
  clearMfaError: () => void;
  sendEmailVerification: () => Promise<void>;
  checkEmailVerification: () => Promise<void>;
  emailVerificationSent: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mfaError, setMfaError] = useState<MultiFactorError | null>(null);
  const [mfaResolver, setMfaResolver] = useState<any>(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  
  // Use useRef to hold RecaptchaVerifier to avoid re-initializing
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const checkingAdminRef = useRef(false);

  // Stable functions that don't depend on state
  const signup = useCallback((email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password).then(() => {});
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/multi-factor-auth-required') {
        setMfaError(error);
        setMfaResolver(multiFactor(auth).getResolver(error));
        throw new Error('MFA_REQUIRED');
      }
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    return signOut(auth);
  }, []);

  const setupRecaptcha = useCallback((elementId: string) => {
    try {
      // Clear any existing reCAPTCHA first
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }

      // Check if element exists
      const element = document.getElementById(elementId);
      if (!element) {
        console.warn(`reCAPTCHA element with id "${elementId}" not found`);
        return;
      }

      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, elementId, {
        'size': 'invisible',
        'callback': () => {
          console.log('reCAPTCHA solved successfully');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired, clearing...');
          if (recaptchaVerifierRef.current) {
            recaptchaVerifierRef.current.clear();
            recaptchaVerifierRef.current = null;
          }
        }
      });
    } catch (error) {
      console.error('Failed to initialize reCAPTCHA:', error);
      recaptchaVerifierRef.current = null;
    }
  }, []);

  const setupMFA = useCallback(async (phoneNumber: string): Promise<ConfirmationResult> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    if (!recaptchaVerifierRef.current) {
      throw new Error('reCAPTCHA not set up. Please refresh the page and try again.');
    }

    try {
      // Check if email is verified before allowing MFA setup
      const freshUser = auth.currentUser;
      if (!freshUser) {
        throw new Error('User not authenticated');
      }
      
      // Reload user data to get latest verification status
      await reload(freshUser);
      if (!freshUser.emailVerified) {
        throw new Error('Please verify your email address before setting up multi-factor authentication');
      }

      const multiFactorSession = await multiFactor(freshUser).getSession();
      const phoneInfoOptions = {
        phoneNumber,
        session: multiFactorSession
      };

      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptchaVerifierRef.current);
      
      // Return a ConfirmationResult-like object for compatibility
      return {
        verificationId,
        confirm: async (verificationCode: string) => {
          const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
          const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
          await multiFactor(freshUser).enroll(multiFactorAssertion, 'Phone Number');
          return { user: freshUser };
        }
      } as ConfirmationResult;
    } catch (error: any) {
      console.error('MFA setup error:', error);
      
      // Clear reCAPTCHA on error to allow retry
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
      
      throw error;
    }
  }, [currentUser]);

  const verifyMFASetup = useCallback(async (verificationCode: string, confirmationResult: ConfirmationResult) => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    await confirmationResult.confirm(verificationCode);
  }, [currentUser]);

  const resolveMFA = useCallback(async (verificationCode: string) => {
    if (!mfaResolver || !recaptchaVerifierRef.current) {
      throw new Error('No MFA resolver available or reCAPTCHA not set up');
    }

    // Get the hint (enrolled phone factor)
    const hint = mfaResolver.hints[0];
    
    const phoneInfoOptions = {
      multiFactorHint: hint,
      session: mfaResolver.session
    };

    const phoneAuthProvider = new PhoneAuthProvider(auth);
    const verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptchaVerifierRef.current);
    
    const phoneAuthCredential = PhoneAuthProvider.credential(verificationId, verificationCode);
    const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(phoneAuthCredential);
    
    await mfaResolver.resolveSignIn(multiFactorAssertion);
    setMfaError(null);
    setMfaResolver(null);
  }, [mfaResolver]);

  const clearMfaError = useCallback(() => {
    setMfaError(null);
    setMfaResolver(null);
  }, []);

  const sendEmailVerification = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }
    
    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }

    if (emailVerificationSent) {
      throw new Error('Verification email has already been sent. Please check your email.');
    }

    await sendEmailVerification(user);
    setEmailVerificationSent(true);
  }, [emailVerificationSent]);

  const checkEmailVerification = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    // Force refresh the user to get latest verification status
    await reload(user);
    
    if (!user.emailVerified) {
      throw new Error('Email is not yet verified. Please check your email and click the verification link.');
    }
  }, []);

  // Separate admin check function that doesn't create dependencies
  const checkAdminStatus = useCallback(async (user: User) => {
    if (checkingAdminRef.current) return; // Prevent concurrent calls
    checkingAdminRef.current = true;

    try {
      const token = await user.getIdToken(false);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://degree-works-backend-hydrabeans.replit.app/api/admin/check', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.isAdmin || false);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      checkingAdminRef.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;
      
      setCurrentUser(user);
      setLoading(false);
      
      // Handle admin status check - only for verified users
      if (user?.emailVerified) {
        checkAdminStatus(user);
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
      // Clear any ongoing admin checks
      checkingAdminRef.current = false;
    };
  }, []); // Remove checkAdminStatus from dependencies to prevent recursion

  const value = useMemo(() => ({
    currentUser,
    isAdmin,
    login,
    signup,
    logout,
    loading,
    mfaError,
    setupMFA,
    verifyMFASetup,
    resolveMFA,
    setupRecaptcha,
    clearMfaError,
    sendEmailVerification,
    checkEmailVerification,
    emailVerificationSent
  }), [
    currentUser,
    isAdmin,
    login,
    signup,
    logout,
    loading,
    mfaError,
    setupMFA,
    verifyMFASetup,
    resolveMFA,
    setupRecaptcha,
    clearMfaError,
    sendEmailVerification,
    checkEmailVerification,
    emailVerificationSent
  ]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
