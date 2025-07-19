import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { 
  CheckIcon,
  StarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { createCheckoutSession, PRODUCT_IDS } from '@/lib/stripe/stripeService';
import { useAuth } from '@/lib/firebase/AuthContext';

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

const PricingCard: React.FC<{
  title: string;
  price: string;
  period?: string;
  features: string[];
  isPopular?: boolean;
  isEnterprise?: boolean;
  onSubscribe: (isAnnual: boolean) => void;
  loading?: boolean;
  user?: any;
}> = ({ title, price, period, features, isPopular, isEnterprise, onSubscribe, loading, user }) => {
  return (
    <Card className={`relative ${isPopular ? 'ring-2 ring-primary' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
            <StarIcon className="h-3 w-3" />
            <span>Most Popular</span>
          </div>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">{title}</CardTitle>
        <div className="mt-2">
          <span className="text-3xl font-bold">{price}</span>
          {period && <span className="text-muted-foreground ml-1">{period}</span>}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start space-x-3">
              <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button
          onClick={() => onSubscribe(!isEnterprise)}
          loading={loading}
          disabled={loading}
          className="w-full"
          variant={isPopular ? "default" : "outline"}
        >
          {loading ? 'Loading...' : user ? (isEnterprise ? 'Contact Sales' : 'Get Started') : 'Sign in to Subscribe'}
        </Button>
      </CardContent>
    </Card>
  );
};

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();

  const handleCheckout = async (isAnnual: boolean) => {
    try {
      if (!auth.user) {
        await auth.signInWithGoogle();
        return;
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pricing Plans"
      size="xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PricingCard
          title="Starter"
          price="$19.99"
          period="/month"
          features={[
            features[0].title,
            features[1].title,
            "Basic analytics dashboard"
          ]}
          onSubscribe={() => handleCheckout(false)}
          loading={isLoading}
          user={auth.user}
        />
        
        <PricingCard
          title="Professional"
          price="$16.50"
          period="/month (billed annually)"
          features={[
            features[0].title,
            features[1].title,
            features[2].title,
            features[3].title,
            features[4].title
          ]}
          isPopular
          onSubscribe={() => handleCheckout(true)}
          loading={isLoading}
          user={auth.user}
        />
        
        <PricingCard
          title="Enterprise"
          price="Custom"
          features={[
            ...features.map(f => f.title),
            "Custom Integrations",
            "Dedicated Account Manager"
          ]}
          isEnterprise
          onSubscribe={() => window.location.href = 'mailto:easymarketingautomations@gmail.com'}
          loading={isLoading}
          user={auth.user}
        />
      </div>
    </Modal>
  );
}; 