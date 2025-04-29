'use client'
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface Subreddit {
  name: string;
  subscribers: number;
  accounts_active: number;
  description: string;
  url: string;
  matches: number;
}

interface Output {
  subject: string;
  body: string;
  custRedditHandle: string;
}

interface ApiResponse {
  subreddits?: Subreddit[];
  output?: Output;
}

export default function RedditDMPage() {
  const [fields, setFields] = useState({
    productName: '',
    productUrl: '',
    problemSolved: '',
    elevatorPitch: '',
    ask: '',
    redditHandle: '',
    email: '',
    subreddit: '',
  });
  const [touched, setTouched] = useState({
    productName: false,
    productUrl: false,
    problemSolved: false,
    elevatorPitch: false,
    ask: false,
    redditHandle: false,
    email: false,
    subreddit: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ApiResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setTouched({ ...touched, [e.target.name]: true });
  };
  
  const validateFields = () => {
    return (
      fields.productName.trim() !== '' &&
      fields.productUrl.trim() !== '' &&
      fields.problemSolved.trim().length >= 100 &&
      fields.elevatorPitch.trim().length >= 100 &&
      fields.ask.trim() !== '' &&
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
    setError(null);
    
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
      setTimeout(() => setSubmitted(false), 2500);
    }
  };

  return (
    <div className="reddit-dm-container">
      <div className="reddit-dm-header">
        <div className="reddit-dm-logo">
          <span className="reddit-dm-logo-icon">
            <svg width="20" height="20" fill="none"><path d="M5 10.5V15a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-4.5M12 4h2.5A1.5 1.5 0 0 1 16 5.5V8m-8 0V5.5A1.5 1.5 0 0 1 9.5 4H12m-4 4h8m-8 0v8m8-8v8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <span className="reddit-dm-logo-text">Founderflow</span>
        </div>
        <a href="#" className="reddit-dm-login">Log in</a>
      </div>
      <h1 className="reddit-dm-title">Reddit DM Automation</h1>
      <p className="reddit-dm-desc">
        The user provides product details, problem being solved, elevator pitch, and contact information. When they hit submit, it triggers an n8n workflow to find relevant subreddits, top potential users that fit the elevator pitch and optimized reddit DM copy on the page.
      </p>
      <form className="reddit-dm-form" onSubmit={handleSubmit} autoComplete="off">
        <div className="reddit-dm-field">
          <label>Product Name *</label>
          <div className="reddit-dm-input-wrap">
            <span className="reddit-dm-input-icon">📦</span>
            <input
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
            <span className="reddit-dm-char-count">{fields.productName.length}/60</span>
          </div>
        </div>
        
        <div className="reddit-dm-field">
          <label>Product URL *</label>
          <div className="reddit-dm-input-wrap">
            <span className="reddit-dm-input-icon">🔗</span>
            <input
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
            <span className="reddit-dm-char-count">{fields.productUrl.length}/100</span>
          </div>
        </div>
        
        <div className="reddit-dm-field">
          <label>Problem Being Solved * (min. 100 characters)</label>
          <div className="reddit-dm-input-wrap textarea-wrap">
            <span className="reddit-dm-input-icon">❓</span>
            <textarea
              name="problemSolved"
              placeholder="Describe the problem your product solves"
              value={fields.problemSolved}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={500}
              className={touched.problemSolved && fields.problemSolved.length < 100 ? 'invalid' : ''}
              required
            />
            <span className="reddit-dm-char-count">{fields.problemSolved.length}/500</span>
          </div>
          {touched.problemSolved && fields.problemSolved.length < 100 && (
            <div className="reddit-dm-error">Minimum 100 characters required</div>
          )}
        </div>
        
        <div className="reddit-dm-field">
          <label>Elevator Pitch * (min. 100 characters)</label>
          <div className="reddit-dm-input-wrap textarea-wrap">
            <span className="reddit-dm-input-icon">💡</span>
            <textarea
              name="elevatorPitch"
              placeholder="Your product elevator pitch"
              value={fields.elevatorPitch}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={500}
              className={touched.elevatorPitch && fields.elevatorPitch.length < 100 ? 'invalid' : ''}
              required
            />
            <span className="reddit-dm-char-count">{fields.elevatorPitch.length}/500</span>
          </div>
          {touched.elevatorPitch && fields.elevatorPitch.length < 100 && (
            <div className="reddit-dm-error">Minimum 100 characters required</div>
          )}
        </div>
        
        <div className="reddit-dm-field">
          <label>Ask from user *</label>
          <div className="reddit-dm-input-wrap">
            <span className="reddit-dm-input-icon">🎯</span>
            <select
              name="ask"
              value={fields.ask}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.ask && !fields.ask ? 'invalid' : ''}
              required
            >
              <option value="">Select what you want from users</option>
              <option value="Sign up for trial">Sign up for trial</option>
              <option value="Try the product and provide feedback">Try the product and provide feedback</option>
              <option value="Subscribe">Subscribe</option>
            </select>
          </div>
        </div>
        
        <div className="reddit-dm-field">
          <label>Your Reddit Handle *</label>
          <div className="reddit-dm-input-wrap">
            <span className="reddit-dm-input-icon">👤</span>
            <input
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
            <span className="reddit-dm-char-count">{fields.redditHandle.length}/30</span>
          </div>
        </div>
        
        <div className="reddit-dm-field">
          <label>Email Address *</label>
          <div className="reddit-dm-input-wrap">
            <span className="reddit-dm-input-icon">✉️</span>
            <input
              name="email"
              type="email"
              placeholder="Your email address"
              value={fields.email}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={60}
              className={touched.email && !fields.email ? 'invalid' : ''}
              required
            />
            <span className="reddit-dm-char-count">{fields.email.length}/60</span>
          </div>
        </div>
        
        <div className="reddit-dm-field">
          <label>Top Subreddit Name *</label>
          <div className="reddit-dm-input-wrap">
            <span className="reddit-dm-input-icon">🔍</span>
            <input
              name="subreddit"
              type="text"
              placeholder="e.g. r/startups"
              value={fields.subreddit}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={30}
              className={touched.subreddit && !fields.subreddit ? 'invalid' : ''}
              required
            />
            <span className="reddit-dm-char-count">{fields.subreddit.length}/30</span>
          </div>
        </div>
        
        <button type="submit" disabled={!allFilled || submitted || loading} className={allFilled ? 'active' : ''}>
          {loading ? 'Processing...' : submitted ? 'Submitted!' : 'Submit'}
        </button>
      </form>
      
      {error && (
        <div className="reddit-dm-error-message">
          {error}
        </div>
      )}
      
      {results.length > 0 && (
        <div className="reddit-dm-results">
          {results.map((result, index) => (
            <div key={index} className="reddit-dm-result-section">
              {result.subreddits && (
                <div className="reddit-dm-subreddits">
                  <h2>Recommended Subreddits</h2>
                  <div className="reddit-dm-subreddits-list">
                    {result.subreddits.map((subreddit, idx) => (
                      <div key={idx} className="reddit-dm-subreddit-card">
                        <h3>r/{subreddit.name}</h3>
                        <div className="reddit-dm-subreddit-stats">
                          <span>{subreddit.subscribers.toLocaleString()} subscribers</span>
                        </div>
                        <p>{subreddit.description}</p>
                        <a href={subreddit.url} target="_blank" rel="noopener noreferrer" className="reddit-dm-subreddit-link">
                          Visit Subreddit
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {result.output && (
                <div className="reddit-dm-dm-template">
                  <h2>Generated DM Template</h2>
                  <div className="reddit-dm-dm-content">
                    <h3>{result.output.subject}</h3>
                    <div className="reddit-dm-dm-body markdown-content">
                      <ReactMarkdown>{result.output.body}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <style jsx>{`
        .reddit-dm-container {
          max-width: 600px;
          margin: 40px auto;
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 2px 16px 0 rgba(0,0,0,0.06);
          padding: 40px 32px;
          font-family: Inter, system-ui, sans-serif;
        }
        .reddit-dm-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        .reddit-dm-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .reddit-dm-logo-icon {
          background: #2563eb;
          border-radius: 8px;
          padding: 6px;
          display: inline-flex;
          align-items: center;
        }
        .reddit-dm-logo-text {
          font-weight: 700;
          font-size: 22px;
          letter-spacing: 0.01em;
        }
        .reddit-dm-login {
          color: #222;
          font-weight: 500;
          font-size: 16px;
          opacity: 0.85;
          text-decoration: none;
        }
        .reddit-dm-title {
          font-size: 40px;
          font-weight: 800;
          margin: 0 0 16px 0;
          color: #1e293b;
        }
        .reddit-dm-desc {
          color: #475569;
          font-size: 17px;
          margin-bottom: 32px;
        }
        .reddit-dm-form {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }
        .reddit-dm-field label {
          font-weight: 600;
          color: #222;
          font-size: 16px;
          margin-bottom: 6px;
          display: block;
        }
        .reddit-dm-input-wrap {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          padding: 0 10px;
          transition: box-shadow 0.2s, border-color 0.2s;
        }
        .textarea-wrap {
          align-items: flex-start;
          padding: 10px;
        }
        .reddit-dm-input-wrap:focus-within {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px #2563eb22;
        }
        .reddit-dm-input-icon {
          margin-right: 6px;
          font-size: 1.1em;
          opacity: 0.7;
          margin-top: 3px;
        }
        .reddit-dm-char-count {
          margin-left: auto;
          font-size: 0.92em;
          color: #94a3b8;
          min-width: 48px;
          text-align: right;
        }
        .reddit-dm-form input, .reddit-dm-form textarea, .reddit-dm-form select {
          border: none;
          outline: none;
          background: transparent;
          width: 100%;
          padding: 13px 0;
          font-size: 16px;
          transition: background 0.2s;
          font-family: inherit;
        }
        .reddit-dm-form select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 30px;
        }
        .reddit-dm-form textarea {
          min-height: 100px;
          resize: vertical;
          padding: 10px 0;
        }
        .reddit-dm-form input:focus, .reddit-dm-form textarea:focus, .reddit-dm-form select:focus {
          background: #eef2ff;
        }
        .reddit-dm-form input.invalid, .reddit-dm-form textarea.invalid, .reddit-dm-form select.invalid {
          background: #fff0f0;
        }
        .reddit-dm-error {
          color: #dc2626;
          font-size: 14px;
          margin-top: 5px;
        }
        .reddit-dm-form button {
          margin-top: 10px;
          background: #1746d9;
          color: #fff;
          font-weight: 700;
          font-size: 18px;
          border: none;
          border-radius: 8px;
          padding: 13px 0;
          cursor: pointer;
          box-shadow: 0 2px 8px 0 rgba(23,70,217,0.08);
          width: 100%;
          opacity: 0.7;
          transition: background 0.2s, opacity 0.2s, transform 0.1s;
        }
        .reddit-dm-form button.active {
          opacity: 1;
          background: #2563eb;
        }
        .reddit-dm-form button:active {
          transform: scale(0.98);
        }
        .reddit-dm-form button:disabled {
          cursor: not-allowed;
          background: #bcd0fa;
        }
        .reddit-dm-success {
          margin-top: 22px;
          background: #e0fbe0;
          color: #166534;
          border-radius: 8px;
          padding: 14px 0;
          text-align: center;
          font-weight: 600;
          font-size: 1.1em;
          animation: fadeIn 0.5s;
        }
        .reddit-dm-error-message {
          margin-top: 22px;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 8px;
          padding: 14px 0;
          text-align: center;
          font-weight: 600;
          font-size: 1.1em;
          animation: fadeIn 0.5s;
        }
        .reddit-dm-results {
          margin-top: 40px;
          border-top: 1px solid #e5e7eb;
          padding-top: 30px;
        }
        .reddit-dm-result-section {
          margin-bottom: 30px;
        }
        .reddit-dm-result-section h2 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 20px;
          color: #1e293b;
        }
        .reddit-dm-subreddits-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .reddit-dm-subreddit-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e5e7eb;
        }
        .reddit-dm-subreddit-card h3 {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 10px 0;
          color: #1e293b;
        }
        .reddit-dm-subreddit-stats {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 12px;
        }
        .reddit-dm-subreddit-card p {
          font-size: 14px;
          color: #475569;
          margin-bottom: 16px;
          line-height: 1.5;
        }
        .reddit-dm-subreddit-link {
          display: inline-block;
          background: #2563eb;
          color: white;
          font-weight: 600;
          font-size: 14px;
          padding: 8px 16px;
          border-radius: 6px;
          text-decoration: none;
          transition: background 0.2s;
        }
        .reddit-dm-subreddit-link:hover {
          background: #1d4ed8;
        }
        .reddit-dm-dm-template {
          background: #f8fafc;
          border-radius: 12px;
          padding: 24px;
          border: 1px solid #e5e7eb;
        }
        .reddit-dm-dm-content h3 {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 16px 0;
          color: #1e293b;
        }
        .reddit-dm-dm-body {
          font-size: 15px;
          line-height: 1.6;
          color: #334155;
        }
        .markdown-content {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        .markdown-content p {
          margin: 0 0 12px 0;
        }
        .markdown-content strong {
          font-weight: 600;
        }
        .markdown-content em {
          font-style: italic;
        }
        .markdown-content a {
          color: #2563eb;
          text-decoration: none;
        }
        .markdown-content a:hover {
          text-decoration: underline;
        }
        .markdown-content ul, .markdown-content ol {
          margin: 0 0 12px 0;
          padding-left: 24px;
        }
        .markdown-content li {
          margin-bottom: 4px;
        }
        .markdown-content code {
          background-color: #f1f5f9;
          padding: 2px 4px;
          border-radius: 4px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.9em;
        }
        .markdown-content pre {
          background-color: #f1f5f9;
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 0 0 12px 0;
        }
        .markdown-content pre code {
          background-color: transparent;
          padding: 0;
        }
        .markdown-content blockquote {
          border-left: 4px solid #e2e8f0;
          margin: 0 0 12px 0;
          padding-left: 12px;
          color: #64748b;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: none; }
        }
        @media (max-width: 600px) {
          .reddit-dm-container {
            max-width: 100%;
            margin: 0;
            border-radius: 0;
            padding: 18px 4vw;
            min-height: 100vh;
          }
          .reddit-dm-title {
            font-size: 1.5rem;
          }
          .reddit-dm-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
            margin-bottom: 18px;
          }
          .reddit-dm-form {
            gap: 14px;
          }
          .reddit-dm-form input, .reddit-dm-form textarea, .reddit-dm-form select {
            font-size: 15px;
            padding: 11px 0;
          }
          .reddit-dm-form button {
            font-size: 1rem;
            padding: 11px 0;
          }
          .reddit-dm-subreddits-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
} 