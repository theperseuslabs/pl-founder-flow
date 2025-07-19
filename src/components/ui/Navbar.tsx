'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/firebase/AuthContext';
import { Button } from './Button';
import { Dropdown, DropdownItem } from './Dropdown';
import { 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import { checkSubscriptionStatus } from '@/lib/stripe/stripeService';

export interface NavbarProps {
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ className }) => {
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
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <nav className={`bg-white border-b border-gray-200 shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <img src="/logo.png" alt="EMA Logo" className="h-8 w-auto transition-transform duration-200 group-hover:scale-105" />
            <span className="text-xl font-bold text-gray-900 transition-colors duration-200 group-hover:text-blue-600">
              Easy Marketing Automation
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            {isSubscribed && (
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/dashboard'}
                leftIcon={<FolderIcon className="h-4 w-4" />}
                className="transition-all duration-200 hover:bg-blue-50 hover:text-blue-600"
              >
                All Projects
              </Button>
            )}
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {auth.loading ? (
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : auth.user ? (
              <Dropdown
                trigger={
                  <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 rounded-md p-2 transition-all duration-200 hover:scale-105">
                    <img
                      src={auth.user.photoURL || '/default-avatar.png'}
                      alt={auth.user.displayName || 'User'}
                      className="h-8 w-8 rounded-full transition-transform duration-200 hover:scale-110"
                    />
                    <span className="text-sm font-medium text-gray-900 hidden sm:block">
                      {auth.user.displayName || auth.user.email}
                    </span>
                  </div>
                }
                align="right"
              >
                <div className="p-2 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <img
                      src={auth.user.photoURL || '/default-avatar.png'}
                      alt={auth.user.displayName || 'User'}
                      className="h-8 w-8 rounded-full"
                    />
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {auth.user.displayName || 'User'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {auth.user.email}
                      </div>
                    </div>
                  </div>
                </div>
                <DropdownItem
                  icon={<UserCircleIcon className="h-4 w-4" />}
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Dashboard
                </DropdownItem>
                <DropdownItem
                  icon={<Cog6ToothIcon className="h-4 w-4" />}
                  onClick={() => {/* TODO: Settings page */}}
                >
                  Settings
                </DropdownItem>
                <DropdownItem
                  icon={<ArrowRightOnRectangleIcon className="h-4 w-4" />}
                  onClick={handleSignOut}
                >
                  Sign Out
                </DropdownItem>
              </Dropdown>
            ) : (
              <Button 
                onClick={handleSignIn} 
                variant="default"
                className="transition-all duration-200 hover:scale-105"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}; 