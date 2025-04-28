import React from 'react';

export default function RedditDMPage() {
  return (
    <div style={{
      maxWidth: 600,
      margin: '40px auto',
      background: '#fff',
      borderRadius: 20,
      boxShadow: '0 2px 16px 0 rgba(0,0,0,0.06)',
      padding: '40px 32px',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ background: '#2563eb', borderRadius: 8, padding: 6, display: 'inline-flex', alignItems: 'center' }}>
            <svg width="20" height="20" fill="none"><path d="M5 10.5V15a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-4.5M12 4h2.5A1.5 1.5 0 0 1 16 5.5V8m-8 0V5.5A1.5 1.5 0 0 1 9.5 4H12m-4 4h8m-8 0v8m8-8v8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <span style={{ fontWeight: 700, fontSize: 22, letterSpacing: 0.01 }}>Founderflow</span>
        </div>
        <a href="#" style={{ color: '#222', fontWeight: 500, fontSize: 16, opacity: 0.85, textDecoration: 'none' }}>Log in</a>
      </div>
      <h1 style={{ fontSize: 40, fontWeight: 800, margin: 0, marginBottom: 16, color: '#1e293b' }}>Reddit DM Automation</h1>
      <p style={{ color: '#475569', fontSize: 17, marginBottom: 32 }}>
        The user provides, communities of interest, product elevator pitch, icp definition, email. When they hit submit, it triggers an n8n workflow to find relevant subreddits, top potential users that fit the elevator pitch and optimized reddit DM copy on the page.
      </p>
      <form style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <label style={{ fontWeight: 600, color: '#222', fontSize: 16, marginBottom: 6, display: 'block' }}>Communities of interest</label>
          <input type="text" placeholder="Add communities of interest" style={{ width: '100%', padding: '13px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 16, marginTop: 4, background: '#f8fafc' }} />
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#222', fontSize: 16, marginBottom: 6, display: 'block' }}>Product elevator pitch</label>
          <input type="text" placeholder="Add product elevator pitch" style={{ width: '100%', padding: '13px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 16, marginTop: 4, background: '#f8fafc' }} />
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#222', fontSize: 16, marginBottom: 6, display: 'block' }}>ICP definition</label>
          <input type="text" placeholder="Add definition" style={{ width: '100%', padding: '13px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 16, marginTop: 4, background: '#f8fafc' }} />
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#222', fontSize: 16, marginBottom: 6, display: 'block' }}>Email</label>
          <input type="email" placeholder="Email" style={{ width: '100%', padding: '13px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 16, marginTop: 4, background: '#f8fafc' }} />
        </div>
        <button type="submit" style={{ marginTop: 10, background: '#1746d9', color: '#fff', fontWeight: 700, fontSize: 18, border: 'none', borderRadius: 8, padding: '13px 0', cursor: 'pointer', boxShadow: '0 2px 8px 0 rgba(23,70,217,0.08)' }}>
          Submit
        </button>
      </form>
    </div>
  );
} 