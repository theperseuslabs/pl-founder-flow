import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea, Form, FormField } from '@/components/ui';
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

export const RedditDMSection: React.FC<RedditDMSectionProps & { onClose?: () => void, projectId?: string }> = ({ 
  initialFields = {}, 
  mode = 'create', 
  onSubmit, 
  showResults = true, 
  onClose, 
  projectId 
}) => {
  const [fields, setFields] = useState({
    productName: initialFields.productName || '',
    productUrl: initialFields.productUrl || '',    
    ask: initialFields.ask || '',
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [expandedSubreddits, setExpandedSubreddits] = useState<number[]>([]);
  const [editedDM, setEditedDM] = useState<{ subject: string; body: string } | null>(null);
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
    const lastResult = results[results.length - 1];
    if (lastResult?.output) {
      setEditedDM({
        subject: lastResult.output.subject || '',
        body: lastResult.output.body || ''
      });
    }
  }, [results]);

  useEffect(() => {
    if (showResults === false && results.length > 0) {
      if (onClose) onClose();
      if (projectId) {
        router.push(`/project/${projectId}`);
      } else {
        router.push('/dashboard');
      }
    }
  }, [showResults, results, onClose, projectId, router]);

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

      track('User ID Updated', {
        user_id: getUserId(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating user ID:', error);
    }
  };

  useEffect(() => {
    if (auth?.user && results.length > 0 && results[0]?.id) {
      updateUserIdInDatabase(results[0].id);
      if (!showResults) {
        router.push(`/project/${results[0].id}`);
      }
    }
  }, [auth?.user, results, showResults, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validateFields = () => {
      if (!fields.productName.trim()) {
        alert('Please enter your business/product name');
        return false;
      }
      if (!fields.productUrl.trim()) {
        alert('Please enter your product/website URL');
        return false;
      }
      if (!fields.ask.trim()) {
        alert('Please select the intent of outreach');
        return false;
      }
      return true;
    };

    if (!validateFields()) return;

    setLoading(true);
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
      // Simulate progress steps
      for (let i = 0; i < progressSteps.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const response = await fetch('https://n8n-ncsw48oo08gwc0okcwcg0c0c.194.195.92.250.sslip.io/webhook/generate_deliverables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          output: {
            product_name: fields.productName,
            outcome: '',
            offering: '',
            differentiator: '',
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
      setCurrentStep(-1);
    }
  };

  const toggleSubreddit = (index: number) => {
    setExpandedSubreddits(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleDMChange = (field: 'subject' | 'body', value: string) => {
    setEditedDM(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const ProgressLoader = () => {
    if (currentStep === -1) return null;

    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        <div className="text-center text-gray-600 mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Processing your request...</p>
        </div>
        <div className="space-y-2">
          {progressSteps.map((step, index) => (
            <div 
              key={index} 
              className={`flex items-center space-x-3 p-2 rounded ${
                index === currentStep ? 'bg-blue-50 text-blue-700' : 
                index < currentStep ? 'bg-green-50 text-green-700' : 
                'bg-gray-50 text-gray-500'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                index < currentStep ? 'bg-green-500 text-white' : 
                index === currentStep ? 'bg-blue-500 text-white' : 
                'bg-gray-300 text-gray-600'
              }`}>
                {index < currentStep ? '✓' : index === currentStep ? '⟳' : index + 1}
              </div>
              <span className="text-sm">{step}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section id="reddit-dm-section" className="bg-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Try it out here in seconds
          </h2>
          <p className="text-lg text-gray-600">
            Enter your product details and we'll find your ideal customers on Reddit.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ProgressLoader />
            ) : error ? (
              <div className="text-center space-y-4">
                <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                  <p className="font-medium">Error: {error}</p>
                </div>
                <Button 
                  onClick={() => setError(null)}
                  className="transition-all duration-200 hover:scale-105"
                >
                  Try Again
                </Button>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-6">
                {/* Results display */}
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            r/{result.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {result.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>👥 {result.subscribers?.toLocaleString() || 'N/A'} members</span>
                            <span>📊 {result.active_user_count?.toLocaleString() || 'N/A'} online</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {result.relevance_score}% relevant
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {result.reasoning}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-center space-x-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setResults([])}
                    className="transition-all duration-200 hover:scale-105"
                  >
                    Start Over
                  </Button>
                  <Button 
                    variant="reddit"
                    className="transition-all duration-200 hover:scale-105"
                  >
                    Send to Leads
                  </Button>
                </div>
              </div>
            ) : (
              <Form onSubmit={handleSubmit} className="space-y-6">
                <FormField label="Business/Product Name *" required>
                  <Input
                    name="productName"
                    value={fields.productName}
                    onChange={handleChange}
                    placeholder="Enter your business/product name"
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </FormField>
                
                <FormField label="Product/Website URL *" required>
                  <Input
                    name="productUrl"
                    value={fields.productUrl}
                    onChange={handleChange}
                    placeholder="Enter your product or website URL"
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </FormField>
                
                <FormField label="Intent of Outreach *" required>
                  <select
                    name="ask"
                    value={fields.ask}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select the intent of outreach</option>
                    <option value="Try the product and provide feedback">Try the product and provide feedback</option>
                    <option value="Sign up for trial">Sign up for trial</option>
                    <option value="Subscribe">Subscribe</option>
                  </select>
                </FormField>
                
                <div className="flex justify-center">
                  <Button 
                    type="submit" 
                    variant="reddit" 
                    size="lg" 
                    disabled={loading}
                    className="transition-all duration-200 hover:scale-105"
                  >
                    {loading ? 'Processing...' : 'Get My Reddit Leads'}
                  </Button>
                </div>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default RedditDMSection; 