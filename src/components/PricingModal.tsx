import { useState } from 'react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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
    title: "Unlimited Subreddits",
    description: "Target users across any number of relevant subreddits"
  },
  {
    title: "Analytics Dashboard",
    description: "Track your campaign performance and engagement metrics"
  },
  {
    title: "Priority Support",
    description: "Get help from our team whenever you need it"
  }
];

export const PricingModal = ({ isOpen, onClose }: PricingModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="ff-modal-overlay" onClick={onClose}>
      <div className="ff-modal" onClick={e => e.stopPropagation()}>
        <div className="ff-modal-header">
          <h2>Pricing Plans</h2>
          <button className="ff-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="ff-modal-content">
          <div className="ff-pricing-grid">
            <div className="ff-pricing-card">
              <h3>Starter</h3>
              <div className="ff-price">$19.99<span>/month</span></div>
              <ul className="ff-features">
                <li>
                  <div className="ff-feature-title">{features[0].title}</div>
                  <div className="ff-feature-desc">{features[0].description}</div>
                </li>
                <li>
                  <div className="ff-feature-title">{features[1].title}</div>
                  <div className="ff-feature-desc">{features[1].description}</div>
                </li>
                <li>
                  <div className="ff-feature-title">{features[3].title}</div>
                  <div className="ff-feature-desc">Basic analytics dashboard</div>
                </li>
              </ul>
              <button className="ff-cta-button">Get Started</button>
            </div>
            <div className="ff-pricing-card featured">
              <h3>Professional</h3>
              <div className="ff-price">$16.50<span>/month (billed annually)</span></div>
              <ul className="ff-features">
                <li>
                  <div className="ff-feature-title">{features[0].title}</div>
                  <div className="ff-feature-desc">{features[0].description}</div>
                </li>
                <li>
                  <div className="ff-feature-title">{features[1].title}</div>
                  <div className="ff-feature-desc">{features[1].description}</div>
                </li>
                <li>
                  <div className="ff-feature-title">{features[2].title}</div>
                  <div className="ff-feature-desc">{features[2].description}</div>
                </li>
                <li>
                  <div className="ff-feature-title">{features[3].title}</div>
                  <div className="ff-feature-desc">{features[3].description}</div>
                </li>
                <li>
                  <div className="ff-feature-title">{features[4].title}</div>
                  <div className="ff-feature-desc">{features[4].description}</div>
                </li>
              </ul>
              <button className="ff-cta-button">Get Started</button>
            </div>
            <div className="ff-pricing-card">
              <h3>Enterprise</h3>
              <div className="ff-price">Custom</div>
              <ul className="ff-features">
                {features.map((feature, index) => (
                  <li key={index}>
                    <div className="ff-feature-title">{feature.title}</div>
                    <div className="ff-feature-desc">{feature.description}</div>
                  </li>
                ))}
                <li>
                  <div className="ff-feature-title">Custom Integrations</div>
                  <div className="ff-feature-desc">Integrate with your existing tools and workflows</div>
                </li>
                <li>
                  <div className="ff-feature-title">Dedicated Account Manager</div>
                  <div className="ff-feature-desc">Personal support and strategy guidance</div>
                </li>
              </ul>
              <button className="ff-cta-button">Contact Sales</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 