import './App.css';

function App() {
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
            <button className="ff-input-btn">Input Form</button>
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
        <h2>How it Works</h2>
        <div className="ff-how-steps">
          <div className="ff-step">
            <div className="ff-step-icon">
              <svg width="48" height="48"><rect width="48" height="48" rx="10" fill="#FF4500" /></svg>
            </div>
            <div className="ff-step-title">Stelbed huck lead generation groeffons</div>
          </div>
          <div className="ff-step">
            <div className="ff-step-icon">
              <svg width="48" height="48"><rect width="48" height="48" rx="10" fill="#6EC6CA" /></svg>
            </div>
            <div className="ff-step-title">Increased shneatioq enggeration anert</div>
          </div>
          <div className="ff-step">
            <div className="ff-step-icon">
              <svg width="48" height="48"><rect width="48" height="48" rx="10" fill="#F7C873" /></svg>
            </div>
            <div className="ff-step-title">Cod catse twartion engagemofon a verd growthfl</div>
          </div>
          <div className="ff-step">
            <div className="ff-step-icon">
              <svg width="48" height="48"><rect width="48" height="48" rx="10" fill="#B3C2D1" /></svg>
            </div>
            <div className="ff-step-title">Community growth</div>
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
