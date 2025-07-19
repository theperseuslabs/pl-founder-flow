'use client'

import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea, Modal, Footer } from '@/components/ui';
import { RedditDMSection } from '@/components/RedditDMSection';
import { PricingModal } from '@/components/PricingModal';
import { Clarity } from '@/components/Clarity';
import { track, getUserId } from '@/utils/mixpanel';

interface TopAuthor {
  author: string;
  total_posts: number;
  subreddit: string;
  profile_url: string;
  top_post_title: string;
  url: string;
}

interface Subreddit {
  display_name_prefixed: string;
  title: string;
  description: string;
  subscribers: number;
  top_authors: TopAuthor[];
}

interface Output {
  subject: string;
  body: string;
}

interface ApiResponse {
  id?: string;
  display_name_prefixed?: string;
  title?: string;
  description?: string;
  subscribers?: number;
  top_authors?: TopAuthor[];
  output?: Output;
}

function App() {
  const [fields, setFields] = useState({
    productName: '',
    productUrl: '',
    ask: ''
  });

  const [results, setResults] = useState<ApiResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [expandedCards, setExpandedCards] = useState<number[]>([]);
  const [selectedSubreddits, setSelectedSubreddits] = useState<number[]>([]);
  const [dmContent, setDmContent] = useState({
    subject: '',
    body: ''
  });

  const getRandomWaitTime = () => {
    return Math.floor(Math.random() * 3000) + 2000; // 2-5 seconds
  };

  const ProgressLoader = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      return () => clearInterval(interval);
    }, []);

    return (
      <div className="w-full max-w-md mx-auto">
        <div className="mb-2 flex justify-between text-sm text-gray-600">
          <span>Analyzing your product...</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validateFields = () => {
      if (!fields.productName.trim()) {
        alert('Please enter your business/product name');
        return false;
      }
      if (!fields.productUrl.trim()) {
        alert('Please enter your product/website URL');
        return false;
      }
      if (!fields.ask.trim()) {
        alert('Please select the intent of outreach');
        return false;
      }
      return true;
    };

    if (!validateFields()) return;

    setLoading(true);
    setResults([]);

    // Track form submission
    track('Form Submitted', {
      product_name: fields.productName,
      product_url: fields.productUrl,
      intent: fields.ask,
      user_id: getUserId(),
      timestamp: new Date().toISOString()
    });

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fields.productName,
          url: fields.productUrl,
          ask: fields.ask
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      const data = await response.json();
      
      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, getRandomWaitTime()));
      
      setResults([data]);
      
      // Track successful submission
      track('Form Success', {
        product_name: fields.productName,
        user_id: getUserId(),
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred. Please try again.');
      
      // Track error
      track('Form Error', {
        product_name: fields.productName,
        error: error instanceof Error ? error.message : 'Unknown error',
        user_id: getUserId(),
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFields(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleCardExpansion = (index: number) => {
    setExpandedCards(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const toggleSubreddit = (index: number) => {
    setSelectedSubreddits(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleDMChange = (field: 'subject' | 'body', value: string) => {
    setDmContent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Clarity />    

      {/* Hero Section */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Find & Private Message Your Ideal Customers on Reddit -{' '}
            <span className="text-red-600">Automatically</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Just give us your product url. We'll handle the rest:
          </p>
          <ul className="text-lg text-gray-700 space-y-2 mb-8">
            <li className="flex items-center justify-center space-x-2">
              <span>🌐</span>
              <span>Surface the right subreddits, worthy of your time investment</span>
            </li>
            <li className="flex items-center justify-center space-x-2">
              <span>🎯</span>
              <span>Find high-intent ICP users</span>
            </li>
            <li className="flex items-center justify-center space-x-2">
              <span>✉️</span>
              <span>Automate AI-personalized private messages on Reddit - hands-free</span>
            </li>
          </ul>
          <div className="space-y-4">
            <Button 
              size="lg" 
              variant="reddit"
              onClick={() => handleScrollToSection('reddit-dm-section')}
            >
              Get My First Reddit Leads (Free)
            </Button>
            <p className="text-sm text-gray-500">
              Built for busy founders. See it in action before you commit.
            </p>
            <Button 
              variant="outline" 
              onClick={(e) => {
                e.preventDefault();
                handleScrollToSection('how-it-works');
              }}
            >
              How it Works
            </Button>
          </div>
        </div>
      </section>

      {/* Reddit DM Form Section */}
      <RedditDMSection showResults={true} />

      {/* How it Works Section */}
      <section id="how-it-works" className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tell us about your product</h3>
              <p className="text-gray-600">
                Write a 1–2 sentence elevator pitch so we understand what you're building. Add any keywords or communities already of interest
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Hit Submit</h3>
              <p className="text-gray-600">
                List the communities where your users hang out (e.g. r/startups, r/ai, r/marketing).
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Get what is promised</h3>
              <ul className="text-gray-600 text-left space-y-1">
                <li>• A list of high-fit Reddit users from selected subreddits</li>
                <li>• Top subreddits worth your marketing focus</li>
                <li>• Personalized DM copy tailored to your product and ICP</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Modal */}
      <Modal 
        isOpen={showScheduleModal} 
        onClose={() => setShowScheduleModal(false)}
        title="Schedule Automated DMs"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Would you like to set up automated daily DMs to new relevant users? This will help you continuously engage with your target audience.
          </p>
          <div className="flex space-x-3">
            <Button 
              variant="default"
              onClick={() => {
                track('Schedule DMs Attempt', {
                  product_name: fields.productName,
                  user_id: getUserId(),
                  timestamp: new Date().toISOString()
                });
                setShowScheduleModal(false);
              }}
            >
              📅 Schedule Daily DMs
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                track('Schedule DMs Cancelled', {
                  product_name: fields.productName,
                  user_id: getUserId(),
                  timestamp: new Date().toISOString()
                });
                setShowScheduleModal(false);
              }}
            >
              Not Now
            </Button>
          </div>
        </div>
      </Modal>

      {/* Pricing Modal */}
      <PricingModal 
        isOpen={showPricingModal} 
        onClose={() => setShowPricingModal(false)} 
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
