import { useState, useEffect } from 'react';
import { track, identify, getUserId } from '@/utils/mixpanel';
import Clarity from './components/Clarity';
import { useAuth } from '@/lib/firebase/AuthContext';
import { PricingModal } from './components/PricingModal';
import { RedditDMSection } from './components/RedditDMSection';
import { Button } from './components/ui/Button';

function App() {
  const [showPricingModal, setShowPricingModal] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    identify();
    track('Page View', {
      page: 'Home',
      user_id: getUserId(),
      timestamp: new Date().toISOString(),
    });
  }, []);

  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
    track('Section Scroll', {
      section: sectionId,
      user_id: getUserId(),
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="bg-background text-foreground">
      <Clarity />
      <header className="py-4">
        <div className="container mx-auto flex justify-between items-center">
          <img src="/logo.png" alt="EMA Logo" className="h-10" />
        </div>
      </header>

      <main>
        <section className="py-20 text-center">
          <div className="container mx-auto">
            <h1 className="text-5xl font-bold mb-4">
              Find & Private Message Your Ideal Customers on Reddit -{' '}
              <span className="text-primary">Automatically</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Just give us your product url. We'll handle the rest:
            </p>
            <ul className="space-y-2 text-lg">
              <li>🌐 Surface the right subreddits, worthy of your time investment</li>
              <li>🎯 Find high-intent ICP users</li>
              <li>✉️ Automate AI-personalized private messages on Reddit - hands-free</li>
            </ul>
            <div className="mt-8">
              <Button
                size="lg"
                onClick={() => handleScrollToSection('reddit-dm-section')}
              >
                Get My First Reddit Leads (Free)
              </Button>
              <p className="mt-2 text-sm text-muted-foreground">
                Built for busy founders. See it in action before you commit.
              </p>
              <a
                href="#how-it-works"
                className="mt-4 inline-block text-sm text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  handleScrollToSection('how-it-works');
                }}
              >
                How it Works
              </a>
            </div>
          </div>
        </section>

        <RedditDMSection showResults={true} />

        <section id="how-it-works" className="py-20 bg-muted">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center">
                <div className="text-4xl font-bold text-primary mb-4">1</div>
                <h3 className="text-2xl font-bold mb-2">Tell us about your product</h3>
                <p className="text-muted-foreground">
                  Write a 1–2 sentence elevator pitch so we understand what you're building. Add any keywords or communities already of interest.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-4xl font-bold text-primary mb-4">2</div>
                <h3 className="text-2xl font-bold mb-2">Hit Submit</h3>
                <p className="text-muted-foreground">
                  List the communities where your users hang out (e.g. r/startups, r/ai, r/marketing).
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-4xl font-bold text-primary mb-4">3</div>
                <h3 className="text-2xl font-bold mb-2">Get what is promised</h3>
                <ul className="text-muted-foreground list-disc list-inside">
                  <li>A list of high-fit Reddit users from selected subreddits</li>
                  <li>Top subreddits worth your marketing focus</li>
                  <li>Personalized DM copy tailored to your product and ICP.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
      />
    </div>
  );
}

export default App;
