import { useState } from 'react';
import { createCheckoutSession, PRODUCT_IDS } from '@/lib/stripe/stripeService';
import { useAuth } from '@/lib/firebase/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/Dialog';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';

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
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();

  const handleCheckout = async (isAnnual: boolean) => {
    try {
      if (!auth.user) {
        // If user is not logged in, trigger sign in
        await auth.signInWithGoogle();
        return; // The component will re-render after sign in
      }

      if (!auth.user.email) {
        throw new Error('User email is required');
      }

      setIsLoading(true);
      await createCheckoutSession(
        isAnnual ? PRODUCT_IDS.ANNUAL : PRODUCT_IDS.MONTHLY,
        isAnnual,
        auth.user.email
      );
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center">Pricing Plans</DialogTitle>
          <DialogDescription className="text-center text-lg">
            Choose the plan that's right for you.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="border rounded-lg p-6 flex flex-col"
          >
            <h3 className="text-2xl font-bold mb-4">Starter</h3>
            <p className="text-4xl font-bold mb-4">$19.99<span className="text-lg font-normal">/month</span></p>
            <ul className="space-y-4">
              <li>{features[0].title}</li>
              <li>{features[1].title}</li>
              <li>Basic analytics dashboard</li>
            </ul>
            <Button
              className="mt-auto"
              onClick={() => handleCheckout(false)}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : auth.user ? 'Get Started' : 'Sign in to Subscribe'}
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="border rounded-lg p-6 flex flex-col relative border-primary"
          >
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-bl-lg">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold mb-4">Professional</h3>
            <p className="text-4xl font-bold mb-4">$16.50<span className="text-lg font-normal">/month</span></p>
            <p className="text-sm text-muted-foreground mb-4">(billed annually)</p>
            <ul className="space-y-4">
              <li>{features[0].title}</li>
              <li>{features[1].title}</li>
              <li>{features[2].title}</li>
              <li>{features[3].title}</li>
              <li>{features[4].title}</li>
            </ul>
            <Button
              className="mt-auto"
              onClick={() => handleCheckout(true)}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : auth.user ? 'Get Started' : 'Sign in to Subscribe'}
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="border rounded-lg p-6 flex flex-col"
          >
            <h3 className="text-2xl font-bold mb-4">Enterprise</h3>
            <p className="text-4xl font-bold mb-4">Custom</p>
            <ul className="space-y-4">
              {features.map((feature, index) => (
                <li key={index}>{feature.title}</li>
              ))}
              <li>Custom Integrations</li>
              <li>Dedicated Account Manager</li>
            </ul>
            <Button
              className="mt-auto"
              onClick={() => window.location.href = 'mailto:easymarketingautomations@gmail.com'}
            >
              Contact Sales
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 