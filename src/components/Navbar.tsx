'use client';

import { useAuth } from '@/lib/firebase/AuthContext';
import Image from 'next/image';
import Link from 'next/link';

export const Navbar = () => {
  const auth = useAuth();

  const handleSignIn = async () => {
    try {
      await auth.signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.logout();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };
  return (
    <nav className="ff-navbar">
      <div className="ff-navbar-container">
        <Link href="/" className="ff-navbar-logo">
          {/* <Image
            src="/logo.png"
            alt="Easy Marketing Automation"
            width={150}
            height={40}
            priority
          /> */}
        </Link>

        <div className="ff-navbar-right">
          {auth.loading ? (
            <div className="ff-navbar-loading">Loading...</div>
          ) : auth.user ? (
            <div className="ff-navbar-user">              
              <div className="ff-navbar-user-info">
                <img
                  src={auth.user.photoURL || '/default-avatar.png'}
                  alt={auth.user.displayName || 'User'}
                  className="ff-navbar-avatar"
                />
                <span className="ff-navbar-username">
                  {auth.user.displayName || auth.user.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="ff-navbar-signout"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="ff-navbar-signin"
            >
              Sign In
            </button>
          )}
          <button
              onClick={() => window.location.href = 'mailto:easymarketingautomations@gmail.com'}
              className="ff-navbar-signin"
            >
              Contact Us
            </button>
        </div>
      </div>
    </nav>
  );
}; 