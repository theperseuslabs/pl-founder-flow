import './App.css';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ClipLoader } from 'react-spinners';
import { track, identify, getUserId } from '@/utils/mixpanel';
import Clarity from './components/Clarity';
import { useAuth } from '@/lib/firebase/AuthContext';
import { BlurredContent } from '@/components/BlurredContent';

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
  display_name_prefixed?: string;
  title?: string;
  description?: string;
  subscribers?: number;
  top_authors?: TopAuthor[];
  output?: Output;
}

function App() {
  const [isHowItWorksExpanded, setIsHowItWorksExpanded] = useState(false);
  const [expandedCards, setExpandedCards] = useState<number[]>([]);
  const [fields, setFields] = useState(() => {
    // Initialize with empty values first
    const initialFields = {
      productName: '',
      productUrl: '',
      problemSolved: '',
      ask: '',
      redditHandle: '',
      email: '',
    };

    // Only try to load from localStorage on the client side
    if (typeof window !== 'undefined') {
      const savedFields = localStorage.getItem('ema_form_data');
      if (savedFields) {
        try {
          const parsedFields = JSON.parse(savedFields);
          // Merge saved fields with initial fields to ensure all required fields exist
          return { ...initialFields, ...parsedFields };
        } catch (error) {
          console.error('Error loading saved form data:', error);
        }
      }
    }

    return initialFields;
  });
  const [touched, setTouched] = useState({
    productName: false,
    productUrl: false,
    problemSolved: false,
    ask: false,
    redditHandle: false,
    email: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ApiResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingDM, setIsSendingDM] = useState(false);
  const [showRedditModal, setShowRedditModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [redditHandleInput, setRedditHandleInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [redditHandleError, setRedditHandleError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistEmailError, setWaitlistEmailError] = useState('');
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [deliverablesResponse, setDeliverablesResponse] = useState<{
    product_name: string;
    outcome: string;
    offering: string;
    differentiator: string;
  } | null>(null);

  const [editedDeliverables, setEditedDeliverables] = useState<{
    product_name: string;
    outcome: string;
    offering: string;
    differentiator: string;
  } | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [expandedSubreddits, setExpandedSubreddits] = useState<number[]>([]);

  const [editedDM, setEditedDM] = useState<{
    subject: string;
    body: string;
  } | null>(null);

  const [isEditingDM, setIsEditingDM] = useState(false);

  const [isSendingToLeads, setIsSendingToLeads] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  const progressSteps = [
    `Extracting additional keywords for ${fields.productName}`,
    `Finding top subreddits for ${fields.productName}`,
    `Finding top redditors for ${fields.productName}`,
    `Composing reddit engagement DM for ${fields.productName}`,
    'Packaging results...'
  ];
  
  const auth = useAuth();
  
  const getRandomWaitTime = () => {
    // Random time between 1500ms and 3000ms
    return Math.floor(Math.random() * (3000 - 1500 + 1)) + 1500;
  };

  const ProgressLoader = () => {
    if (currentStep === -1) return null;
    
    return (
      <div className="ff-progress-loader">
        <div className="ff-progress-steps">
          {progressSteps.map((step, index) => (
            <div 
              key={index} 
              className={`ff-progress-step ${index === currentStep ? 'active' : index < currentStep ? 'completed' : ''}`}
            >
              <div className="ff-progress-dot">
                {index < currentStep ? '✓' : index === currentStep ? '⟳' : ''}
              </div>
              <div className="ff-progress-text">{step}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Initialize user identification on component mount
  useEffect(() => {
    // Identify user and track page view
    identify();
    track('Page View', {
      page: 'Home',
      user_id: getUserId(),
      timestamp: new Date().toISOString()
    });
  }, []);

  // Validate form fields whenever relevant fields change
  useEffect(() => {
    const validateFields = () => {
      return (
        fields.productName.trim() !== '' &&
        fields.productUrl.trim() !== '' &&
        fields.ask.trim() !== ''
      );
    };
    
    setIsFormValid(validateFields());
  }, [fields.productName, fields.productUrl, fields.ask]);

  // Save form data to localStorage whenever fields change
  useEffect(() => {
    localStorage.setItem('ema_form_data', JSON.stringify(fields));
  }, [fields]);

  useEffect(() => {
    const lastResult = results[results.length - 1];
    if (lastResult?.output) {
      setEditedDM({
        subject: lastResult.output.subject || '',
        body: lastResult.output.body || ''
      });
    }
  }, [results]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Track form field changes with user ID
    // track('Form Field Change', {
    //   field: name,
    //   value_length: value.length,
    //   user_id: getUserId(),
    //   timestamp: new Date().toISOString()
    // });
    
    // Special handling for subreddit input
    if (name === 'subreddit') {
      const cleanValue = value.replace(/[\s,]+/g, '').replace(/^r\//, '');
      setFields((prev: typeof fields) => ({ ...prev, [name]: cleanValue }));
    } else {
      setFields((prev: typeof fields) => ({ ...prev, [name]: value }));
    }
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const dummyData=[
    {
        "top_ranked_authors": [
            {
                "author": "Cat_Booger",
                "avg_score": 3729,
                "avg_upvote_ratio": 0.95,
                "rank_score": 0.6,
                "reason": "High average score",
                "total_posts": 1,
                "profile_url": "https://www.reddit.com/user/Cat_Booger",
                "top_post_title": "Started on April 8th with a 2K account, only trading options, hit 6 figures for the first time in my life. What did you do when you hit your first 6 figures?",
                "url": "https://www.reddit.com/r/Daytrading/comments/1kkb90d/started_on_april_8th_with_a_2k_account_only/"
            },
            {
                "author": "satireplusplus",
                "avg_score": 11,
                "avg_upvote_ratio": 0.9,
                "rank_score": 0.502,
                "reason": "High activity",
                "total_posts": 5,
                "profile_url": "https://www.reddit.com/user/satireplusplus",
                "top_post_title": "Daily r/thetagang Discussion Thread - What are your moves for today?",
                "url": "https://www.reddit.com/r/thetagang/comments/1klge3w/daily_rthetagang_discussion_thread_what_are_your/"
            },
            {
                "author": "AutoModerator",
                "avg_score": 16,
                "avg_upvote_ratio": 0.85,
                "rank_score": 0.502,
                "reason": "High activity",
                "total_posts": 5,
                "profile_url": "https://www.reddit.com/user/AutoModerator",
                "top_post_title": "r/Stocks Daily Discussion &amp; Technicals Tuesday - May 13, 2025",
                "url": "https://www.reddit.com/r/stocks/comments/1klhn9p/rstocks_daily_discussion_technicals_tuesday_may/"
            },
            {
                "author": "GrowYourConscious",
                "avg_score": 1392,
                "avg_upvote_ratio": 0.98,
                "rank_score": 0.287,
                "reason": "High average score",
                "total_posts": 1,
                "profile_url": "https://www.reddit.com/user/GrowYourConscious",
                "top_post_title": "I've Been Options Trading for 10 Years, and These Are My 5 Biggest Tips",
                "url": "https://www.reddit.com/r/options/comments/1ko421w/ive_been_options_trading_for_10_years_and_these/"
            },
            {
                "author": "Prudent_Comfort_9089",
                "avg_score": 1260,
                "avg_upvote_ratio": 0.95,
                "rank_score": 0.269,
                "reason": "High average score",
                "total_posts": 1,
                "profile_url": "https://www.reddit.com/user/Prudent_Comfort_9089",
                "top_post_title": "Using AI to find options trade opportunities. Full guide + prompts below",
                "url": "https://www.reddit.com/r/options/comments/1kbzkii/using_ai_to_find_options_trade_opportunities_full/"
            },
            {
                "author": "iquitoptions",
                "avg_score": 286,
                "avg_upvote_ratio": 0.91,
                "rank_score": 0.138,
                "reason": "High activity",
                "total_posts": 1,
                "profile_url": "https://www.reddit.com/user/iquitoptions",
                "top_post_title": "Losses that haunt me — options trading wiped out my savings. Who else?",
                "url": "https://www.reddit.com/r/options/comments/1kqv3lo/losses_that_haunt_me_options_trading_wiped_out_my/"
            }
        ]
    },
    {
        "top_subreddits": [
            {
                "display_name_prefixed": "r/stocks",
                "title": "Stocks - Investing and trading for all",
                "description": "The most serious place on Reddit for Stock related discussions!  Don't hesitate to tell us about a ticker we should know about, market news, or financial education.\n\nCheck out our WIKI that has beginner &amp; advanced topics on both investing &amp; trading.",
                "subscribers": 8853774,
                "frequency": 5,
                "score": 1,
                "url": "https://www.reddit.com/r/stocks"
            },
            {
                "display_name_prefixed": "r/Daytrading",
                "title": "Daytrading: Information for your everyday trader",
                "description": "Daytrading futures, forex, stocks, etc.",
                "subscribers": 4872060,
                "frequency": 5,
                "score": 0.7751402961042375,
                "url": "https://www.reddit.com/r/Daytrading"
            },
            {
                "display_name_prefixed": "r/investing",
                "title": "Lose money with friends!",
                "description": "",
                "subscribers": 3031924,
                "frequency": 5,
                "score": 0.6712221251638002,
                "url": "https://www.reddit.com/r/investing"
            },
            {
                "display_name_prefixed": "r/options",
                "title": "/r/Options ",
                "description": "Let's Talk About:     \nExchange Traded Financial Options   -- \nOptions Fundamentals     --  \nThe Greeks    --  \nStrategies     --  \nCurrent Plays and Ideas      --  \nQ&amp;A  --   \n**New Traders**: See the Options Questions Safe Haven weekly thread",
                "subscribers": 1293260,
                "frequency": 5,
                "score": 0.5730343918875724,
                "url": "https://www.reddit.com/r/options"
            },
            {
                "display_name_prefixed": "r/thetagang",
                "title": "selling options",
                "description": "We are selling options to WSB degenerates using thetagang strategies!  🐌 🐌 🐌",
                "subscribers": 279971,
                "frequency": 5,
                "score": 0.5158108282411545,
                "url": "https://www.reddit.com/r/thetagang"
            },
            {
                "display_name_prefixed": "r/StockMarket",
                "title": "r/StockMarket - Reddit's Front Page of the Stock Market",
                "description": "Welcome to /r/StockMarket! Our objective is to provide short and mid term trade ideas, market analysis &amp; commentary for active traders and investors. Posts about equities, options, forex, futures, analyst upgrades &amp; downgrades, technical and fundamental analysis, and the stock market in general are all welcome.",
                "subscribers": 3827012,
                "frequency": 1,
                "score": 0.31612320350621104,
                "url": "https://www.reddit.com/r/StockMarket"
            },
            {
                "display_name_prefixed": "r/FinancialPlanning",
                "title": "Financial Planning, Personal Finance, Frugality, Money, and More!",
                "description": "Discuss and ask questions about personal finances, budgeting, income, retirement plans, insurance, investing, and frugality.",
                "subscribers": 958231,
                "frequency": 2,
                "score": 0.2541142681075889,
                "url": "https://www.reddit.com/r/FinancialPlanning"
            }
        ]
    },
    {
        "output": {
            "subject": "Options trading? Saw your comments!",
            "body": "Finding high-yield option trades can be a grind. Wheel Strategy helps find them fast – it's built by option sellers, for option sellers.\n\nI noticed you were chatting about similar stuff, so thought you might dig it. \n\nWant to try it and tell me what you think? -> wheelstrategyoptions.co\n\nAppreciate your thoughts!"
        }
    }
]
  const isDebug = true;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setSubmitted(true);
    setLoading(true);
    setIsSubmitting(true);
    setError(null);
    setResults([]);
    setCurrentStep(0);
    
    // Track form submission with user ID
    track('Form Submission', {
      product_name: fields.productName,
      has_url: !!fields.productUrl,
      user_id: getUserId(),
      timestamp: new Date().toISOString()
    });
    
    try {
      // Simulate progress steps with random wait times
      for (let i = 0; i < progressSteps.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, getRandomWaitTime()));
      }

      const response = await fetch('https://n8n-ncsw48oo08gwc0okcwcg0c0c.194.195.92.250.sslip.io/webhook/generate_deliverables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          output: {
            product_name: editedDeliverables?.product_name || fields.productName,
            outcome: editedDeliverables?.outcome || '',
            offering: editedDeliverables?.offering || '',
            differentiator: editedDeliverables?.differentiator || '',
            prod_url: fields.productUrl,
            cta: fields.ask
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      
      const data = await response.json();
      setResults(data);

      // Track successful results with user ID
      track('Results Generated', {
        has_subreddits: data.length > 0,
        has_message: !!data[data.length - 1]?.output,
        user_id: getUserId(),
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      
      // Track error with user ID
      track('Form Error', {
        error_message: err instanceof Error ? err.message : 'Unknown error',
        user_id: getUserId(),
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
      setCurrentStep(-1);
      setTimeout(() => setSubmitted(false), 2500);
    }
  };

  const steps = [
    {
      title: "Stealth lead generation growth",
      color: "#FF4500",
      description: "Automate your lead generation process with our advanced tools and workflows."
    },
    {
      title: "Increased engagement and retention",
      color: "#6EC6CA",
      description: "Boost engagement rates through targeted and personalized interactions."
    },
    {
      title: "Code case conversion engagement and growth flow",
      color: "#F7C873",
      description: "Convert more leads into customers with optimized conversion strategies."
    },
    {
      title: "Community growth",
      color: "#B3C2D1",
      description: "Build and nurture a thriving community around your brand."
    }
  ];

  const toggleCardExpansion = (index: number) => {
    setExpandedCards(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleEmailResults = () => {
    const subject = "Your Reddit DM Campaign Results";
    const body = `Here are your Reddit DM campaign results:\n\n` +
      `Product: ${fields.productName}\n\n` +
      `Top Subreddits and Authors:\n` +
      results.map(result => {
        if (!result.display_name_prefixed) return '';
        return `- ${result.display_name_prefixed}\n` +
          `  Subscribers: ${result.subscribers?.toLocaleString() || 'N/A'}\n` +
          `  Description: ${result.description || 'N/A'}\n\n` +
          `  Top Authors:\n` +
          (result.top_authors?.map(author => 
            `    - ${author.author.replace('t2_', '')}\n` +
            `      Top Post: ${author.top_post_title}\n` +
            `      Profile: ${author.profile_url}\n`
          ).join('\n') || 'No authors found') + '\n\n';
      }).join('\n') +
      `\nDM Template:\n` +
      (results[results.length - 1]?.output ? 
        `Subject: ${results[results.length - 1].output?.subject || 'No subject available'}\n\n` +
        `${results[results.length - 1].output?.body || 'No message available'}\n` :
        'No DM template available');

    window.location.href = `mailto:${fields.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleRedditDM = async () => {
    if (!redditHandleInput.trim()) {
      setRedditHandleError('Reddit handle is required');
      return;
    }

    // Track DM attempt with user ID
    track('Reddit DM Attempt', {
      reddit_handle: redditHandleInput.trim(),
      user_id: getUserId(),
      timestamp: new Date().toISOString()
    });

    setIsSendingDM(true);
    try {
      const response = await fetch('https://n8n-ncsw48oo08gwc0okcwcg0c0c.194.195.92.250.sslip.io/webhook/sendRedditDM', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          custRedditHandle: redditHandleInput.trim(),
          body: results[2]?.output?.body.replace("[Recipient's Reddit Handle]", redditHandleInput.trim()) || '',
          subject: results[2]?.output?.subject || ''
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send Reddit DM');
      }
      
      // Track successful DM with user ID
      track('Reddit DM Sent', {
        reddit_handle: redditHandleInput.trim(),
        user_id: getUserId(),
        timestamp: new Date().toISOString()
      });

      // Close the modal on success
      setShowRedditModal(false);
      setRedditHandleInput('');
      setRedditHandleError('');
    } catch (error) {
      setError('Failed to send Reddit DM. Please try again.');
      
      // Track DM error with user ID
      track('Reddit DM Error', {
        reddit_handle: redditHandleInput.trim(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
        user_id: getUserId(),
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsSendingDM(false);
    }
  };

  // Track scroll to sections
  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
    
    // Track section scroll with user ID
    track('Section Scroll', {
      section: sectionId,
      user_id: getUserId(),
      timestamp: new Date().toISOString()
    });
  };

  const handleWaitlistSubmit = async () => {
    if (!waitlistEmail.trim()) {
      setWaitlistEmailError('Email is required');
      return;
    }

    setIsSubmittingWaitlist(true);
    try {
      const response = await fetch('https://n8n-ncsw48oo08gwc0okcwcg0c0c.194.195.92.250.sslip.io/webhook/joinWaitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_id: waitlistEmail.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to join waitlist');
      }

      // Track waitlist signup
      track('Waitlist Signup', {
        email: waitlistEmail.trim(),
        user_id: getUserId(),
        timestamp: new Date().toISOString()
      });
      
      setWaitlistSuccess(true);
      setWaitlistEmail('');
      setWaitlistEmailError('');
      setShowWaitlistModal(false);
    } catch (error) {
      setWaitlistEmailError('Failed to join waitlist. Please try again.');
    } finally {
      setIsSubmittingWaitlist(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!emailInput.trim()) {
      setEmailError('Email is required');
      return;
    }

    setIsSendingEmail(true);
    try {
      const response = await fetch('https://n8n-ncsw48oo08gwc0okcwcg0c0c.194.195.92.250.sslip.io/webhook/sendEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailInput.trim(),
          response: results,          
          productName: fields.productName,
          productUrl: fields.productUrl,
          elevatorPitch: fields.elevatorPitch,
          ask: fields.ask,
          keywords: fields.keywords,
          subreddit: fields.subreddit
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      // Track email sent
      track('Email Sent', {
        email: emailInput.trim(),
        user_id: getUserId(),
        timestamp: new Date().toISOString()
      });
      
      setShowEmailModal(false);
      setEmailInput('');
      setEmailError('');
    } catch (error) {
      setEmailError('Failed to send email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDeliverableChange = (field: string, value: string) => {
    setEditedDeliverables(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handleWebsiteAnalysis = async () => {
    // Track website analysis attempt
    track('Website Analysis Attempt', {
      product_name: fields.productName,
      product_url: fields.productUrl,
      user_id: getUserId(),
      timestamp: new Date().toISOString()
    });

    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      // Ensure URL has https:// prefix
      const productUrl = fields.productUrl.startsWith('http') 
        ? fields.productUrl 
        : `https://${fields.productUrl}`;

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

      const response = await fetch('https://n8n-ncsw48oo08gwc0okcwcg0c0c.194.195.92.250.sslip.io/webhook/generate_elevatorPitch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prod_url: productUrl,
          prod_name: fields.productName
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to generate deliverables');
      }

      const data = await response.json();
      setDeliverablesResponse(data.output);
      setEditedDeliverables(data.output);
    } catch (error) {
      setAnalysisError('Something went wrong, please check if your website URL is correct?');
      console.error('Error generating deliverables:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSubreddit = (index: number) => {
    setExpandedSubreddits(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleDMChange = (field: 'subject' | 'body', value: string) => {
    setEditedDM(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handleSendToLeads = async () => {
    // Track send to leads attempt
    track('Send to Leads Attempt', {
      product_name: fields.productName,
      total_leads: results.reduce((sum, result) => sum + (result.top_authors?.length || 0), 0),
      user_id: getUserId(),
      timestamp: new Date().toISOString()
    });

    if (!editedDM) return;
    setShowPricingModal(true);
  };

  const features = [
    {
      title: "Automated Lead Generation",
      description: "Find and target your ideal customers on Reddit automatically"
    },
    {
      title: "Personalized DM Campaigns",
      description: "Send customized messages to your target audience"
    },
    {
      title: "Daily Automation",
      description: "Set up recurring campaigns to reach new users daily"
    },
    {
      title: "Analytics Dashboard",
      description: "Track your campaign performance and engagement metrics"
    },
    {
      title: "Unlimited Subreddits",
      description: "Target users across any number of relevant subreddits"
    },
    {
      title: "Priority Support",
      description: "Get help from our team whenever you need it"
    }
  ];

  return (
    <div className="ff-root">
      <Clarity />
      {/* Header */}
      <header className="ff-header">
        <div className="ff-logo">
          <img src="/logo.png" alt="EMA Logo" width="200" height="162" />
          {/* <span className="ff-brand">Reddit</span> */}
        </div>
      </header>

      {/* Hero Section */}
      <section className="ff-hero">
        <div className="ff-hero-content">
          <div className="ff-hero-text">
            <h1>Find & Private Message Your Ideal Customers on Reddit - <span className="ff-bold-red">Automatically</span></h1>
            <p className="ff-hero-sub">Just give us your product url. We'll handle the rest:</p>
            <ul className="ff-hero-features">
              <li>🌐 Surface the right subreddits, worthy of your time investment</li>
              <li>🎯 Find high-intent ICP users</li>
              <li>✉️ Automate AI-personalized private messages on Reddit - hands-free</li>
            </ul>
            <div className="ff-hero-cta">
              <button className="ff-cta-button" onClick={() => handleScrollToSection('reddit-dm-section')}>
                Get My First Reddit Leads (Free)
              </button>              
              <p className="ff-cta-note">Built for busy founders. See it in action before you commit.</p>
              <a href="#how-it-works" className="ff-how-it-works-link" onClick={(e) => {
                e.preventDefault();
                handleScrollToSection('how-it-works');
              }}>
                How it Works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Reddit DM Form Section */}
      <section id="reddit-dm-section" className="ff-form-section">      
        <div className="ff-form-container">
          <h2 className="ff-hero-subtitle">Try it out here in seconds</h2>                    
          <form onSubmit={handleSubmit} className="ff-form">
            <div className="ff-form-section">
              <h3 className="ff-form-section-title">Your Product/Business Basic Info</h3>
              
              <div className="ff-form-group">
                <label htmlFor="productName">Business/Product Name *</label>
                <div className="ff-input-wrap">
                  <span className="ff-input-icon">📦</span>
                  <input
                    id="productName"
                    name="productName"
                    type="text"
                    placeholder="Enter your business/product name"
                    value={fields.productName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={100}
                    className={touched.productName && !fields.productName ? 'invalid' : ''}
                    required
                  />
                  <span className="ff-char-count" suppressHydrationWarning>{fields.productName.length}/100</span>
                </div>
              </div>

              <div className="ff-form-group">
                <label htmlFor="productUrl">URL *</label>
                <div className="ff-input-wrap">
                  <span className="ff-input-icon">🔗</span>
                  <input
                    id="productUrl"
                    name="productUrl"
                    // type="url"
                    placeholder="https://your-product-url.com"
                    value={fields.productUrl}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={100}
                    className={touched.productUrl && !fields.productUrl ? 'invalid' : ''}
                    required
                  />
                  <span className="ff-char-count" suppressHydrationWarning>{fields.productUrl.length}/100</span>
                </div>
                <div className="ff-form-group">
                <label htmlFor="ask">Select your ask from the user *</label>
                <div className="ff-input-wrap">
                  <span className="ff-input-icon">🎯</span>
                  <select
                    id="ask"
                    name="ask"
                    value={fields.ask}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={touched.ask && !fields.ask ? 'invalid' : ''}
                    required
                  >
                    <option value="">Select an option</option>
                    <option value="Try the product and provide feedback">Try the product and provide feedback</option>
                    <option value="Sign up for trial">Sign up for trial</option>
                    <option value="Subscribe">Subscribe</option>
                  </select>
                </div>
              </div>
                <button 
                  type="button"
                  onClick={handleWebsiteAnalysis}
                  className="ff-input-btn"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <ClipLoader size={20} color="#ffffff" />
                      <span style={{ marginLeft: '8px' }}>Analyzing...</span>
                    </>
                  ) : 'Get Website Analysis'}
                </button>                
                {analysisError && (
                  <div className="ff-error-message" style={{ marginTop: '1rem' }}>
                    {analysisError}
                  </div>
                )}
                {deliverablesResponse && (
                  <div className="ff-deliverables-response">
                    <h4>Your Product Analysis</h4>
                    <div className="ff-deliverables-grid">
                      <div className="ff-deliverable-item">
                        <h5>Product Name</h5>
                        <textarea
                          value={editedDeliverables?.product_name || ''}
                          onChange={(e) => handleDeliverableChange('product_name', e.target.value)}
                          className="ff-deliverable-input"
                          rows={2}
                        />
                      </div>
                      <div className="ff-deliverable-item">
                        <h5>Outcome</h5>
                        <textarea
                          value={editedDeliverables?.outcome || ''}
                          onChange={(e) => handleDeliverableChange('outcome', e.target.value)}
                          className="ff-deliverable-input"
                          rows={4}
                        />
                      </div>
                      <div className="ff-deliverable-item">
                        <h5>Offering</h5>
                        <textarea
                          value={editedDeliverables?.offering || ''}
                          onChange={(e) => handleDeliverableChange('offering', e.target.value)}
                          className="ff-deliverable-input"
                          rows={4}
                        />
                      </div>
                      <div className="ff-deliverable-item">
                        <h5>Differentiator</h5>
                        <textarea
                          value={editedDeliverables?.differentiator || ''}
                          onChange={(e) => handleDeliverableChange('differentiator', e.target.value)}
                          className="ff-deliverable-input"
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {deliverablesResponse && (
              <button 
                type="submit" 
                disabled={!isFormValid || submitted || loading} 
                className={`ff-submit-btn ${isFormValid ? 'active' : ''} ${isSubmitting ? 'loading' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <ClipLoader size={20} color="#ffffff" />
                    <span style={{ marginLeft: '8px' }}>Processing...</span>
                  </>
                ) : submitted ? 'Submitted!' : 'Submit'}              
              </button>
            )}
          </form>
          
          {error && (
            <div className="ff-error-message">
              {error}
            </div>
          )}
          
          {loading && <ProgressLoader />}
          
          {results.length > 0 && (
            <div>              
              <div className="ff-output-section">
                <h2 className="ff-section-header">Top Subreddits</h2>
                <div className="ff-results">                
                  {results.map((result, index) => {
                    // Skip the last element which contains the message
                    if (index === results.length - 1) return null;
                    
                    const isExpanded = expandedSubreddits.includes(index);
                    const potentialCustomers = result.top_authors?.length || 0;
                    const shouldBlur = !auth?.user && index >= 2;

                    // Add sign-in button after first two subreddits
                    if (index === 2 && !auth?.user) {
                      return (
                        <div key="signin-prompt" className="ff-signin-prompt">
                          <button className="ff-google-signin-btn" onClick={() => auth?.signInWithGoogle()}>
                            <img src="/google.svg" alt="Google" className="ff-google-icon" />
                            Sign in with Google to view all subreddits
                          </button>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={index} className={`ff-result-section ${shouldBlur ? 'ff-blurred-content' : ''}`}>
                        <div className={`ff-subreddit-card ${isExpanded ? 'expanded' : ''}`}>
                          <div 
                            className="ff-subreddit-header"
                            onClick={() => !shouldBlur && toggleSubreddit(index)}
                            style={{ cursor: shouldBlur ? 'not-allowed' : 'pointer' }}
                          >
                            <div className="ff-subreddit-header-content">
                              <h3>
                                <a href={`https://reddit.com${result.display_name_prefixed}`} target="_blank" rel="noopener noreferrer">
                                  {result.display_name_prefixed}
                                </a>
                              </h3>
                              <div className="ff-subreddit-stats">                                
                                <span className="ff-potential-customers">
                                  Found {potentialCustomers} leads from recently active users
                                </span>
                              </div>
                            </div>
                            {!shouldBlur && (
                              <div className="ff-expand-icon">
                                {isExpanded ? '−' : '+'}
                              </div>
                            )}
                          </div>
                          {isExpanded && !shouldBlur && (
                            <>
                              <div className="ff-subreddit-content">
                                <p className="ff-subscriber-count">
                                  {result.subscribers?.toLocaleString() || 'N/A'} subscribers
                                </p>
                                <p className="ff-subreddit-description">{result.description}</p>
                              </div>
                              {result.top_authors && result.top_authors.length > 0 && (
                                <div className="ff-top-authors">
                                  <h4>Top Users</h4>
                                  <ul className="ff-authors-list">
                                    {result.top_authors.map((author, idx) => (
                                      <li key={idx} className="ff-author-item">
                                        <div className="ff-author-info">
                                          <a href={author.profile_url} target="_blank" rel="noopener noreferrer" className="ff-author-handle">
                                            {author.author.replace('t2_', '')}
                                          </a>
                                          <p className="ff-author-post-title">{author.top_post_title}</p>
                                          <a href={author.url} target="_blank" rel="noopener noreferrer" className="ff-view-post-link">
                                            View Post
                                          </a>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Message Section */}
                  {results[results.length - 1]?.output && (
                    <div className="ff-dm-template">
                      <div className="ff-dm-header">
                        <h2>AI-generated Reddit DM template</h2>
                      </div>
                      <p className="ff-section-description">
                        We're building automated Reddit DM campaigns that target your best-fit audience. Join the waitlist to be the first to know when we launch. For now, you can test this personalized DM by providing your Reddit handle below.                        
                      </p>
                      <div className="ff-dm-content">
                        {isEditingDM ? (
                          <>
                            <div className="ff-dm-field">
                              <div className="ff-dm-field-header">
                                <label htmlFor="dm-subject">Subject</label>
                              </div>
                              <textarea
                                id="dm-subject"
                                value={editedDM?.subject || ''}
                                onChange={(e) => handleDMChange('subject', e.target.value)}
                                className="ff-dm-input"
                                rows={2}
                                placeholder="Enter DM subject"
                              />
                            </div>
                            <div className="ff-dm-field">
                              <div className="ff-dm-field-header">
                                <label htmlFor="dm-body">Message</label>
                              </div>
                              <textarea
                                id="dm-body"
                                value={editedDM?.body || ''}
                                onChange={(e) => handleDMChange('body', e.target.value)}
                                className="ff-dm-input"
                                rows={8}
                                placeholder="Enter DM message"
                              />
                            </div>
                          </>
                        ) : (
                          <div className={`ff-dm-preview ${!auth?.user ? 'ff-blurred-content' : ''}`}>
                            <div className="ff-dm-preview-subject">
                              <div className="ff-dm-field-header">
                                <h4>Subject</h4>
                              </div>
                              <p>{editedDM?.subject}</p>
                            </div>
                            <div className="ff-dm-preview-body">
                              <div className="ff-dm-field-header">
                                <h4>Message</h4>
                              </div>
                              <p>
                                {auth?.user 
                                  ? editedDM?.body 
                                  : editedDM?.body?.split('\n').slice(0, 3).join('\n')}
                              </p>
                            </div>
                            {!auth?.user && (
                              <div className="ff-blurred-overlay">
                                <div className="ff-blurred-message">
                                  <h3>Sign in to view full message</h3>
                                  <button className="ff-google-signin-btn" onClick={() => auth?.signInWithGoogle()}>
                                    <img src="/google.svg" alt="Google" className="ff-google-icon" />
                                    Sign in with Google
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="ff-dm-actions">
                          {auth?.user ? (
                            <button
                              className="ff-action-btn send-leads-btn"
                              onClick={handleSendToLeads}
                              disabled={isSendingToLeads || !editedDM}
                            >
                              {isSendingToLeads ? (
                                <>
                                  <ClipLoader size={20} color="#ffffff" />
                                  <span>Sending...</span>
                                </>
                              ) : (
                                <>
                                  <span className="ff-action-icon">📨</span>
                                  Send to {results.reduce((sum, result) => sum + (result.top_authors?.length || 0), 0)} leads
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              className="ff-action-btn send-leads-btn"
                              onClick={() => auth?.signInWithGoogle()}
                            >
                              <span className="ff-action-icon">🔒</span>
                              Sign in to send messages
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      {/* How it Works Section */}
      <section id="how-it-works" className="ff-how">
        <div className="ff-how-content">
          <h2>How It Works</h2>
          
          <div className="ff-how-steps">
            <div className="ff-how-step">
              <div className="ff-step-number">1</div>
              <div className="ff-step-content">
                <h3>Tell us about your product</h3>
                <p>Write a 1–2 sentence elevator pitch so we understand what you're building. Add any keywords or communities already of interest</p>
              </div>
            </div>

            <div className="ff-how-step">
              <div className="ff-step-number">2</div>
              <div className="ff-step-content">
                <h3>Hit Submit</h3>
                <p>List the communities where your users hang out (e.g. r/startups, r/ai, r/marketing).</p>
              </div>
            </div>

            <div className="ff-how-step">
              <div className="ff-step-number">3</div>
              <div className="ff-step-content">
                <h3>Get what is promised</h3>
                <ul className="ff-step-list">
                  <li>A list of high-fit Reddit users from selected subreddits</li>
                  <li>Top subreddits worth your marketing focus</li>
                  <li>Personalized DM copy tailored to your product and ICP. You can even send it your reddit handle and test it.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>      

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="ff-modal-overlay">
          <div className="ff-modal">
            <h3>Schedule Automated DMs</h3>
            <p className="ff-modal-description">
              Would you like to set up automated daily DMs to new relevant users? This will help you continuously engage with your target audience.
            </p>
            <div className="ff-modal-actions">
              <button
                className="ff-action-btn schedule-btn"
                onClick={() => {
                  // Track schedule DMs attempt
                  track('Schedule DMs Attempt', {
                    product_name: fields.productName,
                    user_id: getUserId(),
                    timestamp: new Date().toISOString()
                  });
                  // Handle scheduling logic
                  setShowScheduleModal(false);
                }}
              >
                <span className="ff-action-icon">📅</span>
                Schedule Daily DMs
              </button>
              <button
                className="ff-action-btn cancel-btn"
                onClick={() => {
                  // Track schedule DMs cancellation
                  track('Schedule DMs Cancelled', {
                    product_name: fields.productName,
                    user_id: getUserId(),
                    timestamp: new Date().toISOString()
                  });
                  setShowScheduleModal(false);
                }}
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="ff-modal-overlay">
          <div className="ff-pricing-modal">
            <button 
              className="ff-close-button"
              onClick={() => setShowPricingModal(false)}
            >
              ×
            </button>
            <div className="ff-pricing-header">
              <h2>Start Growing Your Business</h2>
              <p className="ff-pricing-subtitle">Get access to all features and start reaching your ideal customers today</p>
            </div>
            
            <div className="ff-pricing-card">
              <div className="ff-pricing-badge">Most Popular</div>
              <div className="ff-pricing-amount">
                <span className="ff-currency">$</span>
                <span className="ff-price">9.99</span>
                <span className="ff-period">/month</span>
              </div>
              <ul className="ff-features-list">
                {features.map((feature, index) => (
                  <li key={index}>
                    <span className="ff-feature-icon">✓</span>
                    <div className="ff-feature-content">
                      <h4>{feature.title}</h4>
                      <p>{feature.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <button 
                className="ff-action-btn subscribe-btn"
                onClick={() => {
                  // Track subscription attempt
                  track('Subscription Attempt', {
                    product_name: fields.productName,
                    plan: 'monthly',
                    price: 9.99,
                    user_id: getUserId(),
                    timestamp: new Date().toISOString()
                  });
                  // Handle subscription logic
                  setShowPricingModal(false);
                }}
              >
                Subscribe Now
              </button>
              <p className="ff-pricing-note">Cancel anytime. No hidden fees.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
