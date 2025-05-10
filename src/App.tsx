import './App.css';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ClipLoader } from 'react-spinners';
import { track, identify, getUserId } from '@/utils/mixpanel';
import Clarity from './components/Clarity';

interface Subreddit {
  display_name_prefixed: string;
  subscribers: number;
  accounts_active: number;
  description: string;
  url: string;
  matches: number;
}

interface TopAuthor {
  author: string;
  avg_score: number;
  avg_upvote_ratio: number;
  rank_score: number;
  reason: string;
  total_posts: number;
  profile_url: string;
  top_post_title: string;
  url: string;
}

interface Output {
  subject: string;
  body: string;
  custRedditHandle: string;
}

interface ApiResponse {
  top_ranked_authors?: TopAuthor[];
  top_subreddits?: Subreddit[];
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
      elevatorPitch: '',
      keywords: '',
      ask: '',
      redditHandle: '',
      email: '',
      subreddit: '',
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
    elevatorPitch: false,
    keywords: false,
    ask: false,
    redditHandle: false,
    email: false,
    subreddit: false,
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

  const progressSteps = [
    `Extracting additional keywords for ${fields.productName}`,
    `Finding top subreddits for ${fields.productName}`,
    `Finding top redditors for ${fields.productName}`,
    `Composing reddit engagement DM for ${fields.productName}`,
    'Packaging results...'
  ];

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
      pitch_length: fields.elevatorPitch.length,
      has_keywords: !!fields.keywords,
      has_subreddit: !!fields.subreddit,
      user_id: getUserId(),
      timestamp: new Date().toISOString()
    });
    
    try {
      // Simulate progress steps with random wait times
      for (let i = 0; i < progressSteps.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, getRandomWaitTime()));
      }

      const response = await fetch('https://n8n-ncsw48oo08gwc0okcwcg0c0c.194.195.92.250.sslip.io/webhook/11fe63b2-cbf2-4010-91c0-6e82441bcc5a', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prod_biz_name: fields.productName,
          prod_URL: fields.productUrl,
          pitch: fields.elevatorPitch,
          problem: fields.problemSolved,
          keywords: fields.keywords,
          ask: fields.ask,
          custRedditHandle: fields.redditHandle,
          custEmailAddress: fields.email
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      
      const data = await response.json();
      setResults(data);

      // Track successful results with user ID
      track('Results Generated', {
        has_subreddits: !!data[0]?.top_subreddits,
        has_authors: !!data[0]?.top_ranked_authors,
        has_dm_template: !!data[0]?.output,
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
      `Product: ${fields.productName}\n` +
      `Subreddit: ${fields.subreddit}\n\n` +
      `Top Ranked Authors:\n` +
      results.map(result => 
        result.top_ranked_authors?.map(author => 
          `- ${author.author} (Rank Score: ${(author.rank_score * 100).toFixed(1)}%)\n` +
          `  Top Post: ${author.top_post_title}\n` +
          `  Profile: ${author.profile_url}\n`
        ).join('\n')
      ).join('\n') +
      `\nRecommended Subreddits:\n` +
      results.map(result => 
        result.top_subreddits?.map(sub => 
          `- ${sub.display_name_prefixed} (${sub.subscribers.toLocaleString()} subscribers)\n` +
          `  ${sub.description}\n`
        ).join('\n')
      ).join('\n') +
      `\nDM Template:\n` +
      results.map(result => 
        result.output ? 
          `Subject: ${result.output.subject}\n\n` +
          `${result.output.body}\n` :
          ''
      ).join('\n');

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
            <h1>Automated Reddit ICP lead search & DMs for Founders</h1>
            <p className="ff-hero-sub">Find and Reach Your Ideal Customers on Reddit—Effortlessly. Just tell us what your product does. We'll find high-fit users, relevant subreddits, and craft personalized DMs—powered by AI, Reddit tactics, and automation.</p>
            <div className="ff-hero-cta">
              <button className="ff-cta-button" onClick={() => handleScrollToSection('reddit-dm-section')}>
                Try it in seconds
              </button>
              <p className="ff-cta-support">No setup. No signups. No payments.</p>
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
                    type="url"
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
              </div>

              <div className="ff-form-group">
                <label htmlFor="elevatorPitch">Elevator Pitch *</label>
                <div className="ff-input-wrap textarea-wrap">
                  <span className="ff-input-icon">💡</span>
                  <textarea
                    id="elevatorPitch"
                    name="elevatorPitch"
                    placeholder="Please provide the best description of what your product/business does/offers"
                    value={fields.elevatorPitch}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={500}
                    className={touched.elevatorPitch && fields.elevatorPitch.length < 100 ? 'invalid' : ''}
                    required
                  />
                  <span className="ff-char-count" suppressHydrationWarning>{fields.elevatorPitch.length}/500</span>
                </div>
                {touched.elevatorPitch && fields.elevatorPitch.length < 100 && (
                  <div className="ff-error">Minimum 100 characters required</div>
                )}
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
            </div>

            <div className="ff-form-section">
              <h3 className="ff-form-section-title">Additional Optional Targeting Info</h3>

              <div className="ff-form-group">
                <label htmlFor="keywords">Keywords</label>
                <div className="ff-input-wrap">
                  <span className="ff-input-icon">🔑</span>
                  <input
                    id="keywords"
                    name="keywords"
                    type="text"
                    placeholder="Enter comma-separated keywords your users might search"
                    value={fields.keywords}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={100}
                  />
                  <span className="ff-char-count" suppressHydrationWarning>{fields.keywords.length}/100</span>
                </div>
                <div className="ff-helper-text">Enter comma-separated keywords your users might search - optional, but improves targeting.</div>
              </div>

              <div className="ff-form-group">
                <label htmlFor="subreddit">Top Subreddit</label>
                <div className="ff-input-wrap">
                  <span className="ff-input-icon">🔍</span>
                  <input
                    id="subreddit"
                    name="subreddit"
                    type="text"
                    placeholder="e.g. startups (without r/)"
                    value={fields.subreddit}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={30}
                  />
                  <span className="ff-char-count" suppressHydrationWarning>{fields.subreddit.length}/30</span>
                </div>
                <div className="ff-helper-text">Enter ONE subreddit (no r/) where your ideal customers hang out - optional, but helps with targeting.</div>
              </div>
            </div>

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
                <h2 className="ff-section-header">Output</h2>
                <div className="ff-results">                
                  {results.map((result, index) => (
                    <div key={index} className="ff-result-section">
                      {result.top_subreddits && (
                        <div className="ff-subreddits">
                          <h2>Top Subreddits</h2>
                          <p className="ff-section-description">Top subreddits selected based on your pitch, AI-powered keyword search, and subscriber volume.</p>
                          <div className="ff-subreddits-list">
                            {result.top_subreddits.map((subreddit, idx) => (
                              <div key={idx} className="ff-subreddit-card">
                                <div className="ff-subreddit-header">
                                  <h3>
                                    <a href={subreddit.url} target="_blank" rel="noopener noreferrer">
                                      {subreddit.display_name_prefixed}
                                    </a>
                                  </h3>
                                  <div className="ff-subreddit-stats">
                                    <span className="ff-subscriber-count">
                                      {subreddit.subscribers.toLocaleString()} subscribers
                                    </span>
                                  </div>
                                </div>
                                <div className="ff-subreddit-content">
                                  <p className="ff-subreddit-description">{subreddit.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.top_ranked_authors && (
                        <div className="ff-authors">
                          <h2>High-fit Reddit users</h2>
                          <p className="ff-section-description">Top Reddit users ranked by engagement and relevance to your pitch, keywords, and subreddits—with reasons for each pick.</p>
                          <div className="ff-authors-list">
                            {result.top_ranked_authors.map((author, idx) => (
                              <div key={idx} className="ff-author-card">
                                <div className="ff-author-header">
                                  <a href={author.profile_url} target="_blank" rel="noopener noreferrer" className="ff-author-handle">
                                    {author.author}
                                  </a>                                  
                                </div>
                                <div className="ff-author-content">
                                <span className="ff-author-reason">{author.reason}</span>
                                </div>
                                <div className="ff-author-content">
                                  <div className="ff-author-post">
                                    <h4>Top Post</h4>
                                    <p className="ff-author-post-title">{author.top_post_title}</p>
                                    <a href={author.url} target="_blank" rel="noopener noreferrer" className="ff-author-link ff-view-post-btn">
                                      View Post
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.output && (
                        <div className="ff-dm-template">
                          <h2>AI-generated Reddit DM template</h2>
                          <p className="ff-section-description">We're building automated Reddit DM campaigns that target your best-fit audience. Join the waitlist to be the first to know when we launch. For now, you can test this personalized DM by providing your Reddit handle below.</p>
                          <div className="ff-dm-content">
                            <h3>{result.output.subject}</h3>
                            <div className="ff-dm-body markdown-content">
                              <ReactMarkdown>{result.output.body}</ReactMarkdown>
                            </div>
                          </div>
                          <div className="ff-results-actions">
                            <button 
                              className={`ff-action-btn reddit-btn`}
                              onClick={() => setShowRedditModal(true)}
                            >
                              <span className="ff-action-icon">💬</span>
                              Send it me as Reddit DM
                            </button>
                            <button 
                              className={`ff-action-btn email-btn`}
                              onClick={() => setShowEmailModal(true)}
                            >
                              <span className="ff-action-icon">✉️</span>
                              Email it to me
                            </button>
                          </div>
                          {/* Email Modal */}
                          {showEmailModal && (
                            <div className="ff-modal-overlay">
                              <div className="ff-modal">
                                <h3>Enter your email</h3>
                                <p className="ff-modal-description">We'll send the Reddit DM template to your email address.</p>
                                <input
                                  type="email"
                                  value={emailInput}
                                  onChange={e => {
                                    setEmailInput(e.target.value);
                                    setEmailError('');
                                  }}
                                  placeholder="Enter your email"
                                  className={emailError ? 'invalid' : ''}
                                />
                                {emailError && <div className="ff-modal-error">{emailError}</div>}
                                <div className="ff-modal-actions">
                                  <button 
                                    onClick={handleEmailSubmit}
                                    className={`ff-action-btn email-btn ${isSendingEmail ? 'loading' : ''}`}
                                    disabled={isSendingEmail || !emailInput.trim()}
                                  >
                                    {isSendingEmail ? (
                                      <>
                                        <ClipLoader size={20} color="#ffffff" />
                                        <span style={{ marginLeft: '8px' }}>Sending...</span>
                                      </>
                                    ) : 'Send Email'}
                                  </button>
                                  <button 
                                    onClick={() => setShowEmailModal(false)} 
                                    className="ff-action-btn"
                                    disabled={isSendingEmail}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Reddit Handle Modal */}
                          {showRedditModal && (
                            <div className="ff-modal-overlay">
                              <div className="ff-modal">
                                <h3>Enter your Reddit handle</h3>
                                <input
                                  type="text"
                                  value={redditHandleInput}
                                  onChange={e => {
                                    setRedditHandleInput(e.target.value);
                                    if (e.target.value.trim() === '') {
                                      setRedditHandleError('Reddit handle is required');
                                    } else {
                                      setRedditHandleError('');
                                    }
                                  }}
                                  placeholder="Reddit handle"
                                  className={redditHandleError ? 'invalid' : ''}
                                  required
                                />
                                {redditHandleError && <div className="ff-modal-error">{redditHandleError}</div>}
                                <div className="ff-modal-actions">
                                  <button 
                                    onClick={handleRedditDM} 
                                    className={`ff-action-btn reddit-btn ${isSendingDM ? 'loading' : ''}`}
                                    disabled={isSendingDM || !redditHandleInput.trim()}
                                  >
                                    {isSendingDM ? (
                                      <>
                                        <ClipLoader size={20} color="#ffffff" />
                                        <span style={{ marginLeft: '8px' }}>Sending...</span>
                                      </>
                                    ) : 'Send'}
                                  </button>
                                  <button 
                                    onClick={() => setShowRedditModal(false)} 
                                    className="ff-action-btn email-btn"
                                    disabled={isSendingDM}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Waitlist Modal */}
                          {showWaitlistModal && (
                            <div className="ff-modal-overlay">
                              <div className="ff-modal">
                                <h3>Join the Waitlist</h3>
                                <p className="ff-modal-description">Be the first to know when we launch automated Reddit DM campaigns.</p>
                                <input
                                  type="email"
                                  value={waitlistEmail}
                                  onChange={e => {
                                    setWaitlistEmail(e.target.value);
                                    setWaitlistEmailError('');
                                  }}
                                  placeholder="Enter your email"
                                  className={waitlistEmailError ? 'invalid' : ''}
                                />
                                {waitlistEmailError && <div className="ff-modal-error">{waitlistEmailError}</div>}
                                <div className="ff-modal-actions">
                                  <button 
                                    onClick={handleWaitlistSubmit}
                                    className={`ff-action-btn waitlist-btn ${isSubmittingWaitlist ? 'loading' : ''}`}
                                    disabled={isSubmittingWaitlist || !waitlistEmail.trim()}
                                  >
                                    {isSubmittingWaitlist ? (
                                      <>
                                        <ClipLoader size={20} color="#ffffff" />
                                        <span style={{ marginLeft: '8px' }}>Joining...</span>
                                      </>
                                    ) : 'Join Waitlist'}
                                  </button>
                                  <button 
                                    onClick={() => setShowWaitlistModal(false)} 
                                    className="ff-action-btn email-btn"
                                    disabled={isSubmittingWaitlist}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                                  

                  {/* Waitlist Section */}
                  <div className="ff-waitlist-section">
                    <div className="ff-waitlist-content">
                      <h3>Join the Waitlist</h3>
                      <p>Be the first to know when we launch automated Reddit DM campaigns for your product.</p>
                      {waitlistSuccess ? (
                        <div className="ff-waitlist-success">
                          <span className="ff-success-icon">✓</span>
                          <p>Thanks for joining! We'll notify you when we launch.</p>
                        </div>
                      ) : (
                        <button 
                              className={`ff-action-btn waitlist-btn`}
                              onClick={() => setShowWaitlistModal(true)}
                            >
                              <span className="ff-action-icon">🚀</span>
                              Join Waitlist
                            </button> 
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                    <button className="ff-action-btn ff-view-post-btn" onClick={handleSubmit} style={{ minWidth: 140 }}>
                      Regenerate
                    </button>
                  </div>
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
    </div>
  );
}

export default App;
