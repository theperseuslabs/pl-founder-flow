'use client';

import { useAuth } from '@/lib/firebase/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { PricingModal } from './PricingModal';
import { ProfileDropdown } from './ProfileDropdown';
import { checkSubscriptionStatus } from '@/lib/stripe/stripeService';
import { Button } from './ui/Button';

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
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* <Image
            src="/logo.png"
            alt="Easy Marketing Automation"
            width={40}
            height={40}
            priority
          /> */}
          <span className="text-lg font-bold">EMA</span>
        </Link>

        <div className="flex items-center gap-4">
          {isSubscribed && (
            <Button variant="ghost" asChild>
              <Link href="/dashboard">All Projects</Link>
            </Button>
          )}
          {/* <Button variant="ghost" onClick={() => setIsPricingModalOpen(true)}>
            Pricing
          </Button> */}
          <Button variant="ghost" asChild>
            <Link href="mailto:easymarketingautomations@gmail.com">
              Contact Us
            </Link>
          </Button>

          {auth.loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : auth.user ? (
            <div
              className="relative"
              onMouseEnter={() => setIsProfileDropdownOpen(true)}
              onMouseLeave={() => setIsProfileDropdownOpen(false)}
            >
              <Button variant="ghost" className="flex items-center gap-2">
                <img
                  src={auth.user.photoURL || '/default-avatar.png'}
                  alt={auth.user.displayName || 'User'}
                  className="h-8 w-8 rounded-full"
                />
                <span>{auth.user.displayName || auth.user.email}</span>
              </Button>
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
            <Button onClick={handleSignIn}>Sign In</Button>
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