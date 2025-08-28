"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  Modal,
  Footer,
} from "@/components/ui";
import { RedditDMSection } from "@/components/RedditDMSection";
import { PricingModal } from "@/components/PricingModal";
import { Clarity } from "@/components/Clarity";
import { track, getUserId } from "@/utils/mixpanel";

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
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

const heroVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut" as const,
    },
  },
};

const floatingVariants = {
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

function App() {
  const [fields, setFields] = useState({
    productName: "",
    productUrl: "",
    ask: "",
  });

  const [results, setResults] = useState<ApiResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [expandedCards, setExpandedCards] = useState<number[]>([]);
  const [selectedSubreddits, setSelectedSubreddits] = useState<number[]>([]);
  const [dmContent, setDmContent] = useState({
    subject: "",
    body: "",
  });

  const getRandomWaitTime = () => {
    return Math.floor(Math.random() * 3000) + 2000; // 2-5 seconds
  };

  const ProgressLoader = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        setProgress((prev) => {
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
        alert("Please enter your business/product name");
        return false;
      }
      if (!fields.productUrl.trim()) {
        alert("Please enter your product/website URL");
        return false;
      }
      if (!fields.ask.trim()) {
        alert("Please select the intent of outreach");
        return false;
      }
      return true;
    };

    if (!validateFields()) return;

    setLoading(true);
    setResults([]);

    // Track form submission
    track("Form Submitted", {
      product_name: fields.productName,
      product_url: fields.productUrl,
      intent: fields.ask,
      user_id: getUserId(),
      timestamp: new Date().toISOString(),
    });

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fields.productName,
          url: fields.productUrl,
          ask: fields.ask,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      const data = await response.json();

      // Simulate loading time
      await new Promise((resolve) => setTimeout(resolve, getRandomWaitTime()));

      setResults([data]);

      // Track successful submission
      track("Form Success", {
        product_name: fields.productName,
        user_id: getUserId(),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred. Please try again.");

      // Track error
      track("Form Error", {
        product_name: fields.productName,
        error: error instanceof Error ? error.message : "Unknown error",
        user_id: getUserId(),
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleCardExpansion = (index: number) => {
    setExpandedCards((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleSubreddit = (index: number) => {
    setSelectedSubreddits((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleDMChange = (field: "subject" | "body", value: string) => {
    setDmContent((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
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
            ease: "easeInOut",
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
            ease: "easeInOut",
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
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50 py-20 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-left relative z-10">
          <motion.h1
            className="text-gray-900 mb-6"
            variants={heroVariants}
            initial="hidden"
            animate="visible"
            style={{
              fontFamily: "Jost, sans-serif",
              fontWeight: 800,
              fontSize: "24px",
              lineHeight: "100%",
              letterSpacing: "0px",
              textAlign: "left",
            }}
          >
            Reddit Marketing. <br />
            Solved.
          </motion.h1>

          <motion.p
            className="text-xl text-gray-600 mb-8 font-jost"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            style={{ fontFamily: "Jost, sans-serif", textAlign: "left" }}
          >
            Just paste your product's URL.{" "}
            <span className="text-red-600 font-semibold">EMA</span>, our AI,
            finds your customers and top subreddits, starts the conversations,
            and builds meaningful engagement.{" "}
            <span className="text-blue-600 font-semibold">
              All while you are in control.
            </span>
          </motion.p>
        </div>
      </section>

      {/* Reddit DM Form Section */}
      <RedditDMSection showResults={true} />

      {/* Schedule Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Schedule Automated DMs"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Would you like to set up automated daily DMs to new relevant users?
            This will help you continuously engage with your target audience.
          </p>
          <div className="flex space-x-3">
            <Button
              variant="default"
              onClick={() => {
                track("Schedule DMs Attempt", {
                  product_name: fields.productName,
                  user_id: getUserId(),
                  timestamp: new Date().toISOString(),
                });
                setShowScheduleModal(false);
              }}
            >
              📅 Schedule Daily DMs
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                track("Schedule DMs Cancelled", {
                  product_name: fields.productName,
                  user_id: getUserId(),
                  timestamp: new Date().toISOString(),
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

      {/* How It Works Section */}
      <section className="bg-black from-gray-900 via-purple-900 to-gray-900 py-20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,#8b5cf6_0%,transparent_50%)]"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Your Reddit Growth Engine.
            </h2>
            <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 via-purple-400 to-orange-400 bg-clip-text text-transparent mb-8">
              Activated in 3 Simple Steps.
            </h3>
          </div>

          <div className="flex justify-center mb-16">
            <img
              src="/how-it-works-infographic.png"
              alt="How It Works"
              className="w-full h-auto"
            />
          </div>
          {/* Detailed Steps */}
          <div className="space-y-12">
            <div className="rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-purple-300 mb-4">
                1. Distill Your Mission.
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                Provide your URL and your #1 goal. Our AI instantly synthesizes
                your product's value proposition and aligns every action to that
                core objective. This is your mission control, approved by you.
              </p>
            </div>

            <div className="rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-purple-300 mb-4">
                2. Receive Your Playbook.
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                Instantly, our AI scans Reddit and builds your custom strategy.
                It reveals the most valuable subreddits, identifies the
                potential customers and key influencers, crafts the exact,
                human-like words to spark genuine conversations.
              </p>
            </div>

            <div className="rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-orange-300 mb-4">
                3. Activate Automation.
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                You are the strategist. Set the frequency. If needed, adjust the
                tone. Approve the content. Deploy your growth engine with
                complete confidence, knowing you have the final word on
                everything that goes out.
              </p>
            </div>
          </div>
          <div className="text-center mt-16">
            <p className="text-2xl font-semibold text-blue-400">
              Why don't we try it once for your product?
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
