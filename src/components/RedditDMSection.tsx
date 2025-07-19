import React, { useState, useEffect } from 'react';
import { ClipLoader } from 'react-spinners';
import { useAuth } from '@/lib/firebase/AuthContext';
import { track, getUserId } from '@/utils/mixpanel';
import { useRouter } from 'next/navigation';
import { normalizeUrl } from '../utils/normalizeUrl';

export interface RedditDMSectionProps {
  initialFields?: {
    productName?: string;
    productUrl?: string;    
    ask?: string;
  };
  mode?: 'create' | 'edit';
  onSubmit?: (fields: any, results: any) => void;
  showResults?: boolean;
}

export const RedditDMSection: React.FC<RedditDMSectionProps & { onClose?: () => void, projectId?: string }> = ({ initialFields = {}, mode = 'create', onSubmit, showResults = true, onClose, projectId }) => {
  const [fields, setFields] = useState({
    productName: initialFields.productName || '',
    productUrl: initialFields.productUrl || '',    
    ask: initialFields.ask || '',
  });
  const [touched, setTouched] = useState({
    productName: false,
    productUrl: false,    
    ask: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [deliverablesResponse, setDeliverablesResponse] = useState<any>(null);
  const [editedDeliverables, setEditedDeliverables] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [expandedSubreddits, setExpandedSubreddits] = useState<number[]>([]);
  const [editedDM, setEditedDM] = useState<{ subject: string; body: string } | null>(null);
  const [isEditingDM, setIsEditingDM] = useState(false);
  const [isSendingToLeads, setIsSendingToLeads] = useState(false);
  const auth = useAuth();
  const router = useRouter();

  const progressSteps = [
    `Extracting additional keywords for ${fields.productName}`,
    `Finding top subreddits for ${fields.productName}`,
    `Finding top redditors for ${fields.productName}`,
    `Composing reddit engagement DM for ${fields.productName}`,
    'Packaging results...'
  ];

  useEffect(() => {
    setIsFormValid(
      fields.productName.trim() !== '' &&
      fields.productUrl.trim() !== '' &&
      fields.ask.trim() !== ''
    );
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

  useEffect(() => {
    if (showResults === false && submitted) {
      if (onClose) onClose();
      // If projectId is provided, go to that project's details page, else go to dashboard
      if (projectId) {
        router.push(`/project/${projectId}`);
      } else {
        router.push('/dashboard');
      }
    }
  }, [showResults, submitted]);

  const updateUserIdInDatabase = async (id: string) => {
    try {
      const response = await fetch('/api/update-user-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user ID');
      }

      // Track successful user ID update
      track('User ID Updated', {
        user_id: getUserId(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating user ID:', error);
    }
  };
   // Add effect to handle user ID update when user logs in
   useEffect(() => {
    if (auth?.user && results.length > 0 && results[0]?.id) {
      updateUserIdInDatabase(results[0].id);
      if(!showResults) {
      router.push(`/project/${results[0].id}`);
      }
    }
    
  }, [auth?.user, results]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handleDeliverableChange = (field: string, value: string) => {
    setEditedDeliverables((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleWebsiteAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const productUrl = normalizeUrl(fields.productUrl);
      const response = await fetch('https://n8n-ncsw48oo08gwc0okcwcg0c0c.194.195.92.250.sslip.io/webhook/generate_elevatorPitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prod_url: productUrl, prod_name: fields.productName })
      });
      if (!response.ok) throw new Error('Failed to generate deliverables');
      const data = await response.json();
      setDeliverablesResponse(data.output);
      setEditedDeliverables(data.output);
    } catch (error) {
      setAnalysisError('Something went wrong, please check if your website URL is correct?');
    } finally {
      setIsAnalyzing(false);
    }
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
    track('Form Submission', {
      product_name: fields.productName,
      has_url: !!fields.productUrl,
      user_id: getUserId(),
      timestamp: new Date().toISOString()
    });
    try {
      for (let i = 0; i < progressSteps.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      const response = await fetch('https://n8n-ncsw48oo08gwc0okcwcg0c0c.194.195.92.250.sslip.io/webhook/generate_deliverables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          output: {
            product_name: editedDeliverables?.product_name || fields.productName,
            outcome: editedDeliverables?.outcome || '',
            offering: editedDeliverables?.offering || '',
            differentiator: editedDeliverables?.differentiator || '',
            prod_url: fields.productUrl,
            cta: fields.ask
          }
        })
      });
      if (!response.ok) throw new Error('Failed to fetch results');
      const data = await response.json();
      setResults(data);
      track('Results Generated', {
        has_subreddits: data.length > 0,
        has_message: !!data[data.length - 1]?.output,
        user_id: getUserId(),
        timestamp: new Date().toISOString()
      });
      if (onSubmit) onSubmit(fields, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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

  const toggleSubreddit = (index: number) => {
    setExpandedSubreddits(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleGoToDashboard = async () => {
    router.push('/dashboard');
  };

  const handleDMChange = (field: 'subject' | 'body', value: string) => {
    setEditedDM(prev => prev ? { ...prev, [field]: value } : null);
  };

  // ... (other handlers like handleSendToLeads can be added as needed)

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

  return (
    <section className="ff-form-section">
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
              <label htmlFor="productUrl">Product/Website URL *</label>
              <div className="ff-input-wrap">
                <span className="ff-input-icon">🌐</span>
                <input
                  id="productUrl"
                  name="productUrl"
                  type="text"
                  placeholder="Enter your product or website URL"
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
              <label htmlFor="ask">Intent of Outreach *</label>
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
                  <option value="">Select the intent of outreach</option>
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
              ) : 'Summarize My Product/Business'}
            </button>
            {analysisError && (
              <div className="ff-error-message" style={{ marginTop: '1rem' }}>
                {analysisError}
              </div>
            )}
            {deliverablesResponse && (
              <>
                <div className="ff-deliverables-response">
                  <h4>Review and Refine the analysis for {fields.productName}</h4>
                  <div className="ff-deliverables-grid">
                    <div className="ff-deliverable-item">
                      <h5>Outcome</h5>
                      <textarea
                        value={editedDeliverables?.outcome || ''}
                        onChange={(e) => handleDeliverableChange('outcome', e.target.value)}
                        className="ff-deliverable-input"
                        rows={4}
                        maxLength={80}
                      />
                      <span className="ff-char-count" suppressHydrationWarning>
                        {(editedDeliverables?.outcome?.length || 0)}/80
                      </span>
                    </div>
                    <div className="ff-deliverable-item">
                      <h5>Offering</h5>
                      <textarea
                        value={editedDeliverables?.offering || ''}
                        onChange={(e) => handleDeliverableChange('offering', e.target.value)}
                        className="ff-deliverable-input"
                        rows={4}
                        maxLength={80}
                      />
                      <span className="ff-char-count" suppressHydrationWarning>
                        {(editedDeliverables?.offering?.length || 0)}/80
                      </span>
                    </div>
                    <div className="ff-deliverable-item">
                      <h5>Differentiator</h5>
                      <textarea
                        value={editedDeliverables?.differentiator || ''}
                        onChange={(e) => handleDeliverableChange('differentiator', e.target.value)}
                        className="ff-deliverable-input"
                        rows={4}
                        maxLength={80}
                      />
                      <span className="ff-char-count" suppressHydrationWarning>
                        {(editedDeliverables?.differentiator?.length || 0)}/80
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!isFormValid || submitted || loading}
                  className={`ff-submit-btn ${isFormValid ? 'active' : ''} ${isSubmitting ? 'loading' : ''}`}
                  style={{ marginTop: '1.5rem', width: '100%' }}
                >
                  {isSubmitting ? (
                    <>
                      <ClipLoader size={20} color="#ffffff" />
                      <span style={{ marginLeft: '8px' }}>Processing...</span>
                    </>
                  ) : submitted ? 'Submitted!' : 'Find Top Subreddits & Potential Customers'}
                </button>
              </>
            )}
          </div>
        </form>
        {error && <div className="ff-error-message">{error}</div>}
        {loading && <ProgressLoader />}
        {showResults && results.length > 0 && (
          <div>
            <div className="ff-output-section">
              <h2 className="ff-section-header">Top Subreddits</h2>
              <div className="ff-results">
                {results.map((result, index) => {
                  if (index === results.length - 1) return null;
                  if (index === 0) return null;
                  const isExpanded = expandedSubreddits.includes(index);
                  const potentialCustomers = result.top_authors?.length || 0;
                  const shouldBlur = !auth?.user && index >= 2;
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
                                  {result.top_authors.map((author: any, idx: number) => (
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
                              onClick={handleGoToDashboard}
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
  );
};

export default RedditDMSection; 