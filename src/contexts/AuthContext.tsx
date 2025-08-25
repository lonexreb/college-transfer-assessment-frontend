
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
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
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [mfaResolver, setMfaResolver] = useState<any>(null);

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
    if (!recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, elementId, {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          // reCAPTCHA expired
          setRecaptchaVerifier(null);
        }
      });
      setRecaptchaVerifier(verifier);
    }
  }, [recaptchaVerifier]);

  const setupMFA = useCallback(async (phoneNumber: string): Promise<ConfirmationResult> => {
    if (!currentUser || !recaptchaVerifier) {
      throw new Error('User not authenticated or reCAPTCHA not set up');
    }

    // Check if email is verified before allowing MFA setup
    const freshUser = auth.currentUser;
    if (!freshUser) {
      throw new Error('User not authenticated');
    }
    
    // Reload user data only if necessary
    if (!freshUser.emailVerified) {
      await reload(freshUser);
      if (!freshUser.emailVerified) {
        throw new Error('Please verify your email address before setting up multi-factor authentication');
      }
    }

    const multiFactorSession = await multiFactor(currentUser).getSession();
    const phoneInfoOptions = {
      phoneNumber,
      session: multiFactorSession
    };

    const phoneAuthProvider = new PhoneAuthProvider(auth);
    const verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptchaVerifier);
    
    // Return a ConfirmationResult-like object for compatibility
    return {
      verificationId,
      confirm: async (verificationCode: string) => {
        const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
        const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
        await multiFactor(currentUser).enroll(multiFactorAssertion, 'Phone Number');
        return { user: currentUser };
      }
    } as ConfirmationResult;
  }, [currentUser, recaptchaVerifier]);

  const verifyMFASetup = useCallback(async (verificationCode: string, confirmationResult: ConfirmationResult) => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    await confirmationResult.confirm(verificationCode);
  }, [currentUser]);

  const resolveMFA = useCallback(async (verificationCode: string) => {
    if (!mfaResolver || !recaptchaVerifier) {
      throw new Error('No MFA resolver available or reCAPTCHA not set up');
    }

    // Get the hint (enrolled phone factor)
    const hint = mfaResolver.hints[0];
    
    const phoneInfoOptions = {
      multiFactorHint: hint,
      session: mfaResolver.session
    };

    const phoneAuthProvider = new PhoneAuthProvider(auth);
    const verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptchaVerifier);
    
    const phoneAuthCredential = PhoneAuthProvider.credential(verificationId, verificationCode);
    const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(phoneAuthCredential);
    
    await mfaResolver.resolveSignIn(multiFactorAssertion);
    setMfaError(null);
    setMfaResolver(null);
  }, [mfaResolver, recaptchaVerifier]);

  const clearMfaError = useCallback(() => {
    setMfaError(null);
    setMfaResolver(null);
  }, []);

  const sendEmailVerification = useCallback(async () => {
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }
    
    if (currentUser.emailVerified) {
      throw new Error('Email is already verified');
    }

    await sendEmailVerification(currentUser);
  }, [currentUser]);

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

    // User is now verified, trigger auth state update
    // This will cause the auth listener to run and check admin status
  }, []);

  const checkAdminStatus = useCallback(async (user: User | null) => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    // Skip admin check if email is not verified
    if (!user.emailVerified) {
      setIsAdmin(false);
      return;
    }

    try {
      const token = await user.getIdToken(false);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

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
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;
      
      setCurrentUser(user);
      
      // Clear admin status first
      setIsAdmin(false);
      
      // Only check admin status for verified users
      if (user && user.emailVerified) {
        checkAdminStatus(user);
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []); // Remove checkAdminStatus dependency to prevent recursion

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
    checkEmailVerification
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
    checkEmailVerification
  ]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
