'use client'
import React from 'react';

export default function RedditDMPage() {
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
      <form className="reddit-dm-form">
        <div>
          <label>Communities of interest</label>
          <input type="text" placeholder="Add communities of interest" />
        </div>
        <div>
          <label>Product elevator pitch</label>
          <input type="text" placeholder="Add product elevator pitch" />
        </div>
        <div>
          <label>ICP definition</label>
          <input type="text" placeholder="Add definition" />
        </div>
        <div>
          <label>Email</label>
          <input type="email" placeholder="Email" />
        </div>
        <button type="submit">Submit</button>
      </form>
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
        .reddit-dm-form label {
          font-weight: 600;
          color: #222;
          font-size: 16px;
          margin-bottom: 6px;
          display: block;
        }
        .reddit-dm-form input {
          width: 100%;
          padding: 13px 14px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          font-size: 16px;
          margin-top: 4px;
          background: #f8fafc;
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
            padding: 11px 10px;
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