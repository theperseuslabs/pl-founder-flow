import './App.css';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ClipLoader } from 'react-spinners';

interface Subreddit {
  name: string;
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
      const savedFields = localStorage.getItem('founderflow_form_data');
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

  // Save form data to localStorage whenever fields change
  useEffect(() => {
    localStorage.setItem('ema_form_data', JSON.stringify(fields));
  }, [fields]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for subreddit input
    if (name === 'subreddit') {
      // Remove any spaces, commas, and 'r/' prefix if present
      const cleanValue = value.replace(/[\s,]+/g, '').replace(/^r\//, '');
      setFields((prev: typeof fields) => ({ ...prev, [name]: cleanValue }));
    } else {
      setFields((prev: typeof fields) => ({ ...prev, [name]: value }));
    }
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setTouched({ ...touched, [e.target.name]: true });
  };
  
  const validateFields = () => {
    return (
      fields.productName.trim() !== '' &&
      fields.productUrl.trim() !== '' &&
      // fields.problemSolved.trim().length >= 100 &&
      fields.elevatorPitch.trim().length >= 100 &&
      // fields.ask.trim() !== '' &&
      fields.redditHandle.trim() !== '' &&
      fields.email.trim() !== '' &&
      fields.subreddit.trim() !== ''
    );
  };
  
  const allFilled = validateFields();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setLoading(true);
    setIsSubmitting(true);
    setError(null);
    setResults([]);
    
    try {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
      setTimeout(() => setSubmitted(false), 2500);
    }
  };

  const steps = [
    {
      title: "Stelbed huck lead generation groeffons",
      color: "#FF4500",
      description: "Automate your lead generation process with our advanced tools and workflows."
    },
    {
      title: "Increased shneatioq enggeration anert",
      color: "#6EC6CA",
      description: "Boost engagement rates through targeted and personalized interactions."
    },
    {
      title: "Cod catse twartion engagemofon a verd growthfl",
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
          `- r/${sub.name} (${sub.subscribers.toLocaleString()} subscribers)\n` +
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
    setIsSendingDM(true);
    try {
      const response = await fetch('https://n8n-ncsw48oo08gwc0okcwcg0c0c.194.195.92.250.sslip.io/webhook/sendRedditDM', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          custRedditHandle: fields.redditHandle,
          body: results[1]?.output?.body || '',
          subject: results[1]?.output?.subject || ''
        }),
      });
      console.log(fields)
      console.log(results)

      if (!response.ok) {
        throw new Error('Failed to send Reddit DM');
      }      
    } catch (error) {
      setError('Failed to send Reddit DM. Please try again.');
    } finally {
      setIsSendingDM(false);
    }
  };

  const handleSendRedditDM = () => {
    // Implementation of handleSendRedditDM
  };

  const handleSendEmail = () => {
    // Implementation of handleSendEmail
  };

  return (
    <div className="ff-root">
      {/* Header */}
      <header className="ff-header">
        <div className="ff-logo">{/* Placeholder Logo */}
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="8" fill="#222" />
            <text x="50%" y="55%" textAnchor="middle" fill="#fff" fontSize="16" fontFamily="Arial" dy=".3em">FF</text>
          </svg>
          <span className="ff-brand">Easy Marketing Automation - Reddit</span>
        </div>
        <nav className="ff-nav">
          <a href="#" className="ff-nav-link">Home</a>
          <a href="#" className="ff-nav-link">About & Agreements</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="ff-hero">
        <div className="ff-hero-content">
          <div className="ff-hero-text">
            <span className="ff-hero-badge">{/* Reddit icon placeholder */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#FF4500" /></svg>
            </span>
            <h1>Automated Reddit ICP lead search & DMs for Founders</h1>
            <p className="ff-hero-sub">Find and Reach Your Ideal Customers on Reddit—Effortlessly. Just tell us what your product does. We'll find high-fit users, relevant subreddits, and craft personalized DMs—powered by AI, Reddit tactics, and automation.</p>
            <div className="ff-hero-cta">
              <div className="ff-hero-cta-buttons">
                <button className="ff-cta-button" onClick={() => {
                  const element = document.getElementById('reddit-dm-section');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}>Try it in seconds</button>
                <a href="#how-it-works" className="ff-how-it-works-link" onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById('how-it-works');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}>How it Works</a>
              </div>
              <p className="ff-cta-support">No setup. No signups. No payments.</p>
            </div>
          </div>
          <div className="ff-hero-image">
            {/* Placeholder for monitor illustration */}
            <div className="ff-monitor">
              <svg width="260" height="160" viewBox="0 0 260 160" fill="none">
                <rect x="0" y="0" width="260" height="140" rx="8" fill="#222" />
                <rect x="80" y="145" width="100" height="10" rx="3" fill="#E5E5E5" />
                {/* Reddit faces/icons */}
                <circle cx="40" cy="40" r="16" fill="#FF4500" />
                <circle cx="220" cy="40" r="12" fill="#FF4500" />
                <circle cx="200" cy="100" r="10" fill="#FF4500" />
                <rect x="60" y="30" width="140" height="60" rx="6" fill="#fff" />
                <rect x="70" y="40" width="40" height="10" rx="2" fill="#E5E5E5" />
                <rect x="70" y="60" width="80" height="8" rx="2" fill="#E5E5E5" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Reddit DM Form Section */}
      <section id="reddit-dm-section" className="ff-form-section">
        <div className="ff-form-container">
          <h2>Reddit DM Automation</h2>
          <p className="ff-form-subtitle">Configure your automated DM campaign</p>
          
          <form onSubmit={handleSubmit} className="ff-form">
            <div className="ff-form-group">
              <label htmlFor="productName">Product Name *</label>
              <div className="ff-input-wrap">
                <span className="ff-input-icon">📦</span>
                <input
                  id="productName"
                  name="productName"
                  type="text"
                  placeholder="Enter your product name"
                  value={fields.productName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={60}
                  className={touched.productName && !fields.productName ? 'invalid' : ''}
                  required
                />
                <span className="ff-char-count">{fields.productName.length}/60</span>
              </div>
            </div>
            
            <div className="ff-form-group">
              <label htmlFor="productUrl">Product URL *</label>
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
                <span className="ff-char-count">{fields.productUrl.length}/100</span>
              </div>
            </div>
            
            {/* <div className="ff-form-group">
              <label htmlFor="problemSolved">Problem Being Solved * (min. 100 characters)</label>
              <div className="ff-input-wrap textarea-wrap">
                <span className="ff-input-icon">❓</span>
                <textarea
                  id="problemSolved"
                  name="problemSolved"
                  placeholder="Describe the problem your product solves"
                  value={fields.problemSolved}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={500}
                  className={touched.problemSolved && fields.problemSolved.length < 100 ? 'invalid' : ''}
                  required
                />
                <span className="ff-char-count">{fields.problemSolved.length}/500</span>
              </div>
              {touched.problemSolved && fields.problemSolved.length < 100 && (
                <div className="ff-error">Minimum 100 characters required</div>
              )}
            </div> */}
            
            <div className="ff-form-group">
              <label htmlFor="elevatorPitch">Elevator Pitch * (min. 100 characters)</label>
              <div className="ff-input-wrap textarea-wrap">
                <span className="ff-input-icon">💡</span>
                <textarea
                  id="elevatorPitch"
                  name="elevatorPitch"
                  placeholder="Your product elevator pitch"
                  value={fields.elevatorPitch}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={500}
                  className={touched.elevatorPitch && fields.elevatorPitch.length < 100 ? 'invalid' : ''}
                  required
                />
                <span className="ff-char-count">{fields.elevatorPitch.length}/500</span>
              </div>
              {touched.elevatorPitch && fields.elevatorPitch.length < 100 && (
                <div className="ff-error">Minimum 100 characters required</div>
              )}
            </div>
            
            <div className="ff-form-group">
              <label htmlFor="keywords">Keywords (comma separated, max 100 characters)</label>
              <div className="ff-input-wrap">
                <span className="ff-input-icon">🔑</span>
                <input
                  id="keywords"
                  name="keywords"
                  type="text"
                  placeholder="e.g. SaaS, AI, automation"
                  value={fields.keywords}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={100}
                />
                <span className="ff-char-count">{fields.keywords.length}/100</span>
              </div>
            </div>
            
            <div className="ff-form-group">
              <label htmlFor="ask">Select what you want from users</label>
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
                 <option value="Try the product and provide feedback">Try the product and provide feedback</option>                 
                  <option value="Sign up for trial">Sign up for trial</option>                 
                  <option value="Subscribe">Subscribe</option>
                </select>
              </div>
            </div>
            
            <div className="ff-form-group">
              <label htmlFor="redditHandle">Your Reddit Handle *</label>
              <div className="ff-input-wrap">
                <span className="ff-input-icon">👤</span>
                <input
                  id="redditHandle"
                  name="redditHandle"
                  type="text"
                  placeholder="Your Reddit username"
                  value={fields.redditHandle}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={30}
                  className={touched.redditHandle && !fields.redditHandle ? 'invalid' : ''}
                  required
                />
                <span className="ff-char-count">{fields.redditHandle.length}/30</span>
              </div>
            </div>
            
            <div className="ff-form-group">
              <label htmlFor="email">Email Address *</label>
              <div className="ff-input-wrap">
                <span className="ff-input-icon">✉️</span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Your email address"
                  value={fields.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={100}
                  className={touched.email && !fields.email ? 'invalid' : ''}
                  required
                />
                <span className="ff-char-count">{fields.email.length}/100</span>
              </div>
            </div>
            
            <div className="ff-form-group">
              <label htmlFor="subreddit">Top Subreddit Name *</label>
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
                  className={touched.subreddit && !fields.subreddit ? 'invalid' : ''}
                  required
                />
                <span className="ff-char-count">{fields.subreddit.length}/30</span>
              </div>
              {touched.subreddit && !fields.subreddit && (
                <div className="ff-error">Please enter a subreddit name</div>
              )}
            </div>
            
            <button 
              type="submit" 
              disabled={!allFilled || submitted || loading} 
              className={`ff-submit-btn ${allFilled ? 'active' : ''} ${isSubmitting ? 'loading' : ''}`}
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
                          <p className="ff-section-description">Top 5 subreddits selected based on your pitch, AI-powered keyword search, and subscriber volume.</p>
                          <div className="ff-subreddits-list">
                            {result.top_subreddits.map((subreddit, idx) => (
                              <div key={idx} className="ff-subreddit-card">
                                <div className="ff-subreddit-header">
                                  <h3>
                                    <a href={subreddit.url} target="_blank" rel="noopener noreferrer">
                                      r/{subreddit.name}
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
                          <p className="ff-section-description">Top 5 Reddit users ranked by engagement and relevance to your pitch, keywords, and subreddits—with reasons for each pick.</p>
                          <div className="ff-authors-list">
                            {result.top_ranked_authors.map((author, idx) => (
                              <div key={idx} className="ff-author-card">
                                <div className="ff-author-header">
                                  <a href={author.profile_url} target="_blank" rel="noopener noreferrer" className="ff-author-handle">
                                    {author.author}
                                  </a>
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
                          <p className="ff-section-description">Personalized reddit DM copy that can be auto-sent to your top fit reddit users on an ongoing basis (as new users are found by the algorithm). For now, you can provide your reddit handle below and we can send a sample DM. It will go only to you.</p>
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
                          {/* Reddit Handle Modal */}
                          {showRedditModal && (
                            <div className="ff-modal-overlay">
                              <div className="ff-modal">
                                <h3>Enter your Reddit handle</h3>
                                <input
                                  type="text"
                                  value={redditHandleInput}
                                  onChange={e => setRedditHandleInput(e.target.value)}
                                  placeholder="Reddit handle"
                                  className={redditHandleError ? 'invalid' : ''}
                                />
                                {redditHandleError && <div className="ff-modal-error">{redditHandleError}</div>}
                                <div className="ff-modal-actions">
                                  <button onClick={handleSendRedditDM} className="ff-action-btn reddit-btn">Send</button>
                                  <button onClick={() => setShowRedditModal(false)} className="ff-action-btn email-btn">Cancel</button>
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Email Modal */}
                          {showEmailModal && (
                            <div className="ff-modal-overlay">
                              <div className="ff-modal">
                                <h3>Enter your email address</h3>
                                <input
                                  type="email"
                                  value={emailInput}
                                  onChange={e => setEmailInput(e.target.value)}
                                  placeholder="Email address"
                                  className={emailError ? 'invalid' : ''}
                                />
                                {emailError && <div className="ff-modal-error">{emailError}</div>}
                                <div className="ff-modal-actions">
                                  <button onClick={handleSendEmail} className="ff-action-btn email-btn">Send</button>
                                  <button onClick={() => setShowEmailModal(false)} className="ff-action-btn reddit-btn">Cancel</button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                    <button className="ff-action-btn reddit-btn" onClick={handleSubmit} style={{ minWidth: 140 }}>
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

      {/* Footer */}
      <footer className="ff-footer">
        <span>©opyright Fodetrlind Prodjuts & text Yor</span>
      </footer>
    </div>
  );
}

export default App;
