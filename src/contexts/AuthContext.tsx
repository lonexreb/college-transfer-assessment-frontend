
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

  function signup(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password).then(() => {});
  }

  async function login(email: string, password: string) {
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
  }

  function logout() {
    return signOut(auth);
  }

  function setupRecaptcha(elementId: string) {
    if (!recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, elementId, {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved
        }
      });
      setRecaptchaVerifier(verifier);
    }
  }

  async function setupMFA(phoneNumber: string): Promise<ConfirmationResult> {
    if (!currentUser || !recaptchaVerifier) {
      throw new Error('User not authenticated or reCAPTCHA not set up');
    }

    // Check if email is verified before allowing MFA setup
    // Use a fresh reference to avoid state mutation issues
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
  }

  async function verifyMFASetup(verificationCode: string, confirmationResult: ConfirmationResult) {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    await confirmationResult.confirm(verificationCode);
  }

  async function resolveMFA(verificationCode: string) {
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
  }

  function clearMfaError() {
    setMfaError(null);
    setMfaResolver(null);
  }

  async function sendEmailVerification() {
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }
    
    if (currentUser.emailVerified) {
      throw new Error('Email is already verified');
    }

    await sendEmailVerification(currentUser);
  }

  async function checkEmailVerification() {
    const freshUser = auth.currentUser;
    if (!freshUser) {
      throw new Error('No user is currently signed in');
    }

    // Only reload if we need fresh verification status
    await reload(freshUser);
    
    // Update the current user state with fresh verification status
    setCurrentUser({ ...freshUser });
    
    if (!freshUser.emailVerified) {
      throw new Error('Email is not yet verified. Please check your email and click the verification link.');
    }
  }

  const checkAdminStatus = useCallback(async (user: User | null) => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      const token = await user.getIdToken(false); // Don't force refresh to avoid loops
      const response = await fetch('https://degree-works-backend-hydrabeans.replit.app/api/admin/check', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.isAdmin || false);
      } else {
        console.log('Admin check failed:', response.status);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      // Set admin to false but don't prevent app from working
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      await checkAdminStatus(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [checkAdminStatus]);

  const value = {
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
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
