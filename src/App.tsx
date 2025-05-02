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

  // Save form data to localStorage whenever fields change
  useEffect(() => {
    localStorage.setItem('founderflow_form_data', JSON.stringify(fields));
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

  return (
    <div className="ff-root">
      {/* Header */}
      <header className="ff-header">
        <div className="ff-logo">{/* Placeholder Logo */}
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="8" fill="#222" />
            <text x="50%" y="55%" textAnchor="middle" fill="#fff" fontSize="16" fontFamily="Arial" dy=".3em">FF</text>
          </svg>
          <span className="ff-brand">FounderFlow</span>
        </div>
        <nav className="ff-nav">
          <a href="#" className="ff-nav-link">Hogee</a>
          <a href="#" className="ff-nav-link">Adbuuts & Agremants</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="ff-hero">
        <div className="ff-hero-content">
          <div className="ff-hero-text">
            <span className="ff-hero-badge">{/* Reddit icon placeholder */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#FF4500" /></svg>
            </span>
            <h1>Scale Your Reddit Outelaat Outra with<br />with Automated DMs</h1>
            <p className="ff-hero-sub">Automated DMs</p>
            <button className="ff-input-btn" onClick={() => {
              const element = document.getElementById('reddit-dm-section');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}>Input Form</button>
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

      {/* How it Works Section */}
      <section className="ff-how">
        <div 
          className="ff-how-header"
          onClick={() => setIsHowItWorksExpanded(!isHowItWorksExpanded)}
        >
          <h2>How it Works</h2>
          <div className="ff-how-arrow">
            {isHowItWorksExpanded ? '−' : '+'}
          </div>
        </div>
        {isHowItWorksExpanded && (
          <div className="ff-how-steps">
            {steps.map((step, index) => (
              <div key={index} className="ff-step">
                <div className="ff-step-header">
                  <div className="ff-step-icon">
                    <svg width="48" height="48">
                      <rect width="48" height="48" rx="10" fill={step.color} />
                    </svg>
                  </div>
                  <div className="ff-step-title">{step.title}</div>
                </div>
                <div className="ff-step-content">
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
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
            <div className="ff-results">
              {results.map((result, index) => (
                <div key={index} className="ff-result-section">
                  {result.top_ranked_authors && (
                    <div className="ff-authors">
                      <h2>Top Ranked Authors</h2>
                      <div className="ff-authors-list">
                        {result.top_ranked_authors.map((author, idx) => (
                          <div key={idx} className="ff-author-card">
                            <div className="ff-author-header">
                              <h3>
                                <a href={author.profile_url} target="_blank" rel="noopener noreferrer">
                                  {author.author}
                                </a>
                              </h3>
                              <span className="ff-author-reason">{author.reason}</span>
                            </div>
                            <div className="ff-author-content">
                              <div className="ff-author-post">
                                <h4>Top Post</h4>
                                <p>{author.top_post_title}</p>
                                <a href={author.url} target="_blank" rel="noopener noreferrer" className="ff-author-link">
                                  View Post
                                </a>
                              </div>
                              <div className="ff-author-stats">
                                <div className="ff-stat">
                                  <span className="ff-stat-label">Avg Score</span>
                                  <span className="ff-stat-value">{author.avg_score.toLocaleString()}</span>
                                </div>
                                <div className="ff-stat">
                                  <span className="ff-stat-label">Upvote Ratio</span>
                                  <span className="ff-stat-value">{(author.avg_upvote_ratio * 100).toFixed(0)}%</span>
                                </div>
                                <div className="ff-stat">
                                  <span className="ff-stat-label">Rank Score</span>
                                  <span className="ff-stat-value">{(author.rank_score * 100).toFixed(1)}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {result.top_subreddits && (
                    <div className="ff-subreddits">
                      <h2>Recommended Subreddits</h2>
                      <div className="ff-subreddits-list">
                        {result.top_subreddits.map((subreddit, idx) => (
                          <div key={idx} className="ff-subreddit-card">
                            <div className="ff-subreddit-header">
                              <h3>r/{subreddit.name}</h3>
                              <div className="ff-subreddit-stats">
                                <span className="ff-subscriber-count">
                                  {subreddit.subscribers.toLocaleString()} subscribers
                                </span>
                                <span className="ff-match-count">
                                  {subreddit.matches} matches
                                </span>
                              </div>
                            </div>
                            <div className="ff-subreddit-content">
                              <p className="ff-subreddit-description">{subreddit.description}</p>
                              <a href={subreddit.url} target="_blank" rel="noopener noreferrer" className="ff-subreddit-link">
                                Visit Subreddit
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {result.output && (
                    <div className="ff-dm-template">
                      <h2>Generated DM Template</h2>
                      <div className="ff-dm-content">
                        <h3>{result.output.subject}</h3>
                        <div className="ff-dm-body markdown-content">
                          <ReactMarkdown>{result.output.body}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              <div className="ff-results-actions">
                <button 
                  className={`ff-action-btn email-btn ${isSendingDM ? 'loading' : ''}`}
                  onClick={handleEmailResults}
                  disabled={isSendingDM}
                >
                  {isSendingDM ? (
                    <>
                      <ClipLoader size={20} color="#ffffff" />
                      <span style={{ marginLeft: '8px' }}>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span className="ff-action-icon">✉️</span>
                      Send to Email
                    </>
                  )}
                </button>
                <button 
                  className={`ff-action-btn reddit-btn ${isSendingDM ? 'loading' : ''}`}
                  onClick={handleRedditDM}
                  disabled={isSendingDM}
                >
                  {isSendingDM ? (
                    <>
                      <ClipLoader size={20} color="#ffffff" />
                      <span style={{ marginLeft: '8px' }}>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span className="ff-action-icon">💬</span>
                      Send as Reddit DM
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
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
