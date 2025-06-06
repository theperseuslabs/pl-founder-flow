'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/firebase/AuthContext';
import { setCookie } from 'cookies-next';

export default function Dashboard() {
  const auth = useAuth();
  const [isRedditConnected, setIsRedditConnected] = useState(false);

  const handleConnectToReddit = () => {
    const clientId = process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      alert("Reddit API client ID or redirect URI is not configured. Please check environment variables.");
      return;
    }

    const randomState = Math.random().toString(36).substring(2, 15);
    setCookie('reddit_oauth_state', randomState, {
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    const scope = "identity privatemessages".replace(" ", ",");
    const authUrl = `https://www.reddit.com/api/v1/authorize?client_id=${clientId}&response_type=code&state=${randomState}&redirect_uri=${encodeURIComponent(redirectUri)}&duration=permanent&scope=${encodeURIComponent(scope)}`;
    
    window.location.href = authUrl;
  };

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!auth.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Welcome to Reddit DM Scheduler
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sign in to get started
            </p>
          </div>
          <div className="mt-8">
            <button
              onClick={() => auth.signInWithGoogle()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Signed in as {auth.user.email}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Reddit Integration</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Connect your Reddit account to schedule automated DMs
                </p>
              </div>
              <button
                onClick={handleConnectToReddit}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                {isRedditConnected ? 'Reconnect Reddit Account' : 'Connect Reddit Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 