'use client';

import { useAuth } from '@/lib/firebase/AuthContext';
import { useEffect } from 'react';

interface BlurredContentProps {
  children: React.ReactNode;
  title: string;
}

export const BlurredContent = ({ children, title }: BlurredContentProps) => {
  const auth = useAuth();

  useEffect(() => {
    console.log('BlurredContent mounted, auth state:', {
      user: auth.user ? 'logged in' : 'not logged in',
      loading: auth.loading,
      error: auth.error
    });
  }, [auth.user, auth.loading, auth.error]);

  const handleClick = async () => {
    console.log('Sign in button clicked');
    try {
      console.log('Attempting to sign in with Google...');
      await auth.signInWithGoogle();
      console.log('Sign in initiated');
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  if (auth.loading) {
    return (
      <div className="ff-blurred-content">
        <div className="ff-blurred-overlay">
          <div className="ff-blurred-message">
            <h3>Loading...</h3>
          </div>
        </div>
        {children}
      </div>
    );
  }

  if (auth.user) {
    return <>{children}</>;
  }

  return (
    <div className="ff-blurred-content">
      <div className="ff-blurred-overlay">
        <div className="ff-blurred-message">
          <h3>Sign in to see all {title}</h3>
          <button 
            onClick={handleClick} 
            className="ff-google-signin-btn"
            type="button"
          >
            <img src="/google-icon.svg" alt="Google" className="ff-google-icon" />
            Sign in with Google
          </button>
          {auth.error && (
            <div className="ff-auth-error" onClick={auth.clearError}>
              {auth.error}
              <span className="ff-error-close">×</span>
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}; 