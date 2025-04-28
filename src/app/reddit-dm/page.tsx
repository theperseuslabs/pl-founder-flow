'use client'
import React, { useState } from 'react';

export default function RedditDMPage() {
  const [fields, setFields] = useState({
    communities: '',
    pitch: '',
    icp: '',
    email: '',
  });
  const [touched, setTouched] = useState({
    communities: false,
    pitch: false,
    icp: false,
    email: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched({ ...touched, [e.target.name]: true });
  };
  const allFilled = Object.values(fields).every(Boolean);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
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
        The user provides, communities of interest, product elevator pitch, icp definition, email. When they hit submit, it triggers an n8n workflow to find relevant subreddits, top potential users that fit the elevator pitch and optimized reddit DM copy on the page.
      </p>
      <form className="reddit-dm-form" onSubmit={handleSubmit} autoComplete="off">
        <div className="reddit-dm-field">
          <label>Communities of interest</label>
          <div className="reddit-dm-input-wrap">
            <span className="reddit-dm-input-icon">🌐</span>
            <input
              name="communities"
              type="text"
              placeholder="Add communities of interest"
              value={fields.communities}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={60}
              className={touched.communities && !fields.communities ? 'invalid' : ''}
            />
            <span className="reddit-dm-char-count">{fields.communities.length}/60</span>
          </div>
        </div>
        <div className="reddit-dm-field">
          <label>Product elevator pitch</label>
          <div className="reddit-dm-input-wrap">
            <span className="reddit-dm-input-icon">💡</span>
            <input
              name="pitch"
              type="text"
              placeholder="Add product elevator pitch"
              value={fields.pitch}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={80}
              className={touched.pitch && !fields.pitch ? 'invalid' : ''}
            />
            <span className="reddit-dm-char-count">{fields.pitch.length}/80</span>
          </div>
        </div>
        <div className="reddit-dm-field">
          <label>ICP definition</label>
          <div className="reddit-dm-input-wrap">
            <span className="reddit-dm-input-icon">🧑‍💼</span>
            <input
              name="icp"
              type="text"
              placeholder="Add definition"
              value={fields.icp}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={60}
              className={touched.icp && !fields.icp ? 'invalid' : ''}
            />
            <span className="reddit-dm-char-count">{fields.icp.length}/60</span>
          </div>
        </div>
        <div className="reddit-dm-field">
          <label>Email</label>
          <div className="reddit-dm-input-wrap">
            <span className="reddit-dm-input-icon">✉️</span>
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={fields.email}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={60}
              className={touched.email && !fields.email ? 'invalid' : ''}
            />
            <span className="reddit-dm-char-count">{fields.email.length}/60</span>
          </div>
        </div>
        <button type="submit" disabled={!allFilled || submitted} className={allFilled ? 'active' : ''}>
          {submitted ? 'Submitted!' : 'Submit'}
        </button>
      </form>
      {submitted && (
        <div className="reddit-dm-success">🎉 Your info was submitted!</div>
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
        .reddit-dm-input-wrap:focus-within {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px #2563eb22;
        }
        .reddit-dm-input-icon {
          margin-right: 6px;
          font-size: 1.1em;
          opacity: 0.7;
        }
        .reddit-dm-char-count {
          margin-left: auto;
          font-size: 0.92em;
          color: #94a3b8;
          min-width: 48px;
          text-align: right;
        }
        .reddit-dm-form input {
          border: none;
          outline: none;
          background: transparent;
          width: 100%;
          padding: 13px 0;
          font-size: 16px;
          transition: background 0.2s;
        }
        .reddit-dm-form input:focus {
          background: #eef2ff;
        }
        .reddit-dm-form input.invalid {
          background: #fff0f0;
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
          .reddit-dm-form input {
            font-size: 15px;
            padding: 11px 0;
          }
          .reddit-dm-form button {
            font-size: 1rem;
            padding: 11px 0;
          }
        }
      `}</style>
    </div>
  );
} 