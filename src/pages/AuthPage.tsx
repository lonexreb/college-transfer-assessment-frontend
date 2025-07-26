
import React, { useState } from 'react';
import Login from '@/components/Login';

const AuthPage = () => {
  const [isSignupMode, setIsSignupMode] = useState(false);

  const toggleMode = () => {
    setIsSignupMode(!isSignupMode);
  };

  return <Login onToggleMode={toggleMode} isSignupMode={isSignupMode} />;
};

export default AuthPage;
