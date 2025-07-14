'use client';

import { useAuth } from '@/lib/firebase/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { PricingModal } from './PricingModal';
import { ProfileDropdown } from './ProfileDropdown';
import { checkSubscriptionStatus } from '@/lib/stripe/stripeService';

export const Navbar = () => {
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    const checkSubscription = async () => {
      if (auth.user?.email) {
        const status = await checkSubscriptionStatus(auth.user.email);
        setIsSubscribed(status);
      }
    };

    checkSubscription();
  }, [auth.user]);

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
      setIsProfileDropdownOpen(false);
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
          EMA
        </Link>

        <div className="ff-navbar-right">
        {/* {isSubscribed && ( */}
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="ff-navbar-pricing"
            >
              All Projects
            </button>
          {/* )} */}
          {/* <button
            onClick={() => setIsPricingModalOpen(true)}
            className="ff-navbar-pricing"
          >
            Pricing
          </button> */}
          <button
            onClick={() => window.location.href = 'mailto:easymarketingautomations@gmail.com'}
            className="ff-navbar-pricing"
          >
            Contact Us
          </button>          
          {auth.loading ? (
            <div className="ff-navbar-loading">Loading...</div>
          ) : auth.user ? (
            <div className="ff-navbar-user">
              <div 
                className="ff-navbar-user-info"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={auth.user.photoURL || '/default-avatar.png'}
                  alt={auth.user.displayName || 'User'}
                  className="ff-navbar-avatar"
                />
                <span className="ff-navbar-username">
                  {auth.user.displayName || auth.user.email}
                </span>
              </div>
              <ProfileDropdown
                isOpen={isProfileDropdownOpen}
                onClose={() => setIsProfileDropdownOpen(false)}
                userPhoto={auth.user.photoURL || '/default-avatar.png'}
                userName={auth.user.displayName || auth.user.email || ''}
                onSignOut={handleSignOut}
                email={auth.user.email || ''}
              />
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="ff-navbar-signin"
            >
              Sign In
            </button>
          )}          
        </div>
      </div>
      <PricingModal 
        isOpen={isPricingModalOpen} 
        onClose={() => setIsPricingModalOpen(false)} 
      />
    </nav>
  );
}; 