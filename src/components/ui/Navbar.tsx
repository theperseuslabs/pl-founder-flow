"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/firebase/AuthContext";
import { Button } from "./Button";
import { Dropdown, DropdownItem } from "./Dropdown";
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  FolderIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { checkSubscriptionStatus } from "@/lib/stripe/stripeService";

export interface NavbarProps {
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ className }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      console.error("Sign in error:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <nav className={`bg-white border-b border-gray-200 shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <img
              src="/logo.svg"
              alt="EMA Logo"
              className="h-11 w-auto transition-transform duration-200 group-hover:scale-105"
            />
            <span
              className="text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
              style={{
                fontFamily: "Jost, sans-serif",
                fontWeight: 600,
                fontSize: "18px",
                lineHeight: "11px",
                letterSpacing: "0px",
                textAlign: "right",
              }}
            >
              Easy Marketing Automation
            </span>
          </Link>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() =>
                (window.location.href =
                  "https://easymarketingautomations.com/blog/")
              }
              className="transition-all duration-200 hover:bg-blue-50 hover:text-blue-600"
            >
              Blog
            </Button>
            {auth.user && (
              <Button
                variant="ghost"
                onClick={() => (window.location.href = "/dashboard")}
                className="transition-all duration-200 hover:bg-blue-50 hover:text-blue-600"
              >
                Dashboard
              </Button>
            )}
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
                      src={auth.user.photoURL || "/default-avatar.png"}
                      alt={auth.user.displayName || "User"}
                      className="h-8 w-8 rounded-full transition-transform duration-200 hover:scale-110"
                    />
                    <span className="text-sm font-medium text-gray-900 hidden lg:block">
                      {auth.user.displayName || auth.user.email}
                    </span>
                  </div>
                }
                align="right"
              >
                <div className="p-2 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <img
                      src={auth.user.photoURL || "/default-avatar.png"}
                      alt={auth.user.displayName || "User"}
                      className="h-8 w-8 rounded-full"
                    />
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {auth.user.displayName || "User"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {auth.user.email}
                      </div>
                    </div>
                  </div>
                </div>
                <DropdownItem
                  icon={<UserCircleIcon className="h-4 w-4" />}
                  onClick={() => (window.location.href = "/dashboard")}
                >
                  Dashboard
                </DropdownItem>
                <DropdownItem
                  icon={<Cog6ToothIcon className="h-4 w-4" />}
                  onClick={() => {
                    /* TODO: Settings page */
                  }}
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

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Button
                variant="ghost"
                onClick={() => {
                  window.location.href =
                    "https://easymarketingautomations.com/blog/";
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-start transition-all duration-200 hover:bg-blue-50 hover:text-blue-600"
              >
                Blog
              </Button>
              {auth.user && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    window.location.href = "/dashboard";
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start transition-all duration-200 hover:bg-blue-50 hover:text-blue-600"
                >
                  Dashboard
                </Button>
              )}
              {auth.loading ? (
                <div className="flex items-center space-x-2 text-gray-500 px-3 py-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : auth.user ? (
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex items-center space-x-2 px-3 py-2">
                    <img
                      src={auth.user.photoURL || "/default-avatar.png"}
                      alt={auth.user.displayName || "User"}
                      className="h-8 w-8 rounded-full"
                    />
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {auth.user.displayName || "User"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {auth.user.email}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      window.location.href = "/dashboard";
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start transition-all duration-200 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <UserCircleIcon className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      // TODO: Settings page
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start transition-all duration-200 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Cog6ToothIcon className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start transition-all duration-200 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    handleSignIn();
                    setIsMobileMenuOpen(false);
                  }}
                  variant="default"
                  className="w-full transition-all duration-200 hover:scale-105"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
