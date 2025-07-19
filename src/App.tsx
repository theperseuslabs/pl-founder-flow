'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const
    }
  }
};

const heroVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut" as const
    }
  }
};

const floatingVariants = {
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  }
};

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
      <motion.div 
        className="w-full max-w-md mx-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-2 flex justify-between text-sm text-gray-600">
          <span>Analyzing your product...</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </motion.div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <Clarity />    

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-40 left-1/4 w-64 h-64 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, 60, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50 py-20 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent"
            variants={heroVariants}
            initial="hidden"
            animate="visible"
          >
            Find & Private Message Your Ideal Customers on Reddit -{' '}
            <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">Automatically</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-600 mb-8"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            Just give us your product url. We'll handle the rest:
          </motion.p>
          
          <motion.ul 
            className="text-lg text-gray-700 space-y-3 mb-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.li 
              className="flex items-center justify-center space-x-3"
              variants={itemVariants}
            >
              <motion.span 
                className="text-2xl"
                variants={floatingVariants}
                // animate="animate"
              >
                🌐
              </motion.span>
              <span>Surface the right subreddits, worthy of your time investment</span>
            </motion.li>
            <motion.li 
              className="flex items-center justify-center space-x-3"
              variants={itemVariants}
            >
              <motion.span 
                className="text-2xl"
                variants={floatingVariants}
                // animate="animate"
                style={{ animationDelay: "0.5s" }}
              >
                🎯
              </motion.span>
              <span>Find high-intent ICP users</span>
            </motion.li>
            <motion.li 
              className="flex items-center justify-center space-x-3"
              variants={itemVariants}
            >
              <motion.span 
                className="text-2xl"
                variants={floatingVariants}
                // animate="animate"
                style={{ animationDelay: "1s" }}
              >
                ✉️
              </motion.span>
              <span>Automate AI-personalized private messages on Reddit - hands-free</span>
            </motion.li>
          </motion.ul>
          
          <motion.div 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <Button 
                size="lg" 
                variant="reddit"
                onClick={() => handleScrollToSection('reddit-dm-section')}
                className="transform hover:scale-105 transition-transform duration-200"
              >
                Get My First Reddit Leads (Free)
              </Button>
            </motion.div>
            
            <motion.p 
              className="text-sm text-gray-500"
              variants={itemVariants}
            >
              Built for busy founders. See it in action before you commit.
            </motion.p>
            
            <motion.div variants={itemVariants}>
              <Button 
                variant="outline" 
                onClick={(e) => {
                  e.preventDefault();
                  handleScrollToSection('how-it-works');
                }}
                className="transform hover:scale-105 transition-transform duration-200"
              >
                How it Works
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Reddit DM Form Section */}
      <RedditDMSection showResults={true} />

      {/* How it Works Section */}
      <section id="how-it-works" className="relative bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16 bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            How It Works
          </motion.h2>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div 
              className="text-center group"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                1
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Tell us about your product</h3>
              <p className="text-gray-600">
                Write a 1–2 sentence elevator pitch so we understand what you're building. Add any keywords or communities already of interest
              </p>
            </motion.div>

            <motion.div 
              className="text-center group"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                2
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Hit Submit</h3>
              <p className="text-gray-600">
                List the communities where your users hang out (e.g. r/startups, r/ai, r/marketing).
              </p>
            </motion.div>

            <motion.div 
              className="text-center group"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="w-16 h-16 bg-gradient-to-r from-pink-600 to-red-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                3
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Get what is promised</h3>
              <ul className="text-gray-600 text-left space-y-2">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  A list of high-fit Reddit users from selected subreddits
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Top subreddits worth your marketing focus
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Personalized DM copy tailored to your product and ICP
                </li>
              </ul>
            </motion.div>
          </motion.div>
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
