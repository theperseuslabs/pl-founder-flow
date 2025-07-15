'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';
import { track, getUserId } from '@/utils/mixpanel';
import { useRouter } from 'next/navigation';
import { ClipLoader } from 'react-spinners';
import { useAuth } from '@/lib/firebase/AuthContext';

const formSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  productUrl: z.string().url('Please enter a valid URL'),
  ask: z.string().min(1, 'This field is required'),
});

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

export const RedditDMSection: React.FC<RedditDMSectionProps & { onClose?: () => void, projectId?: string }> = ({ initialFields = {}, mode = 'create', onSubmit, showResults = true, onClose, projectId }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [deliverablesResponse, setDeliverablesResponse] = useState<any>(null);
  const [editedDeliverables, setEditedDeliverables] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [expandedSubreddits, setExpandedSubreddits] = useState<number[]>([]);
  const [editedDM, setEditedDM] = useState<{ subject: string; body: string } | null>(null);
  const [isEditingDM, setIsEditingDM] = useState(false);
  const [isSendingToLeads, setIsSendingToLeads] = useState(false);
  const auth = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: initialFields.productName || '',
      productUrl: initialFields.productUrl || '',
      ask: initialFields.ask || '',
    },
  });

  const progressSteps = [
    `Extracting additional keywords for ${form.getValues().productName}`,
    `Finding top subreddits for ${form.getValues().productName}`,
    `Finding top redditors for ${form.getValues().productName}`,
    `Composing reddit engagement DM for ${form.getValues().productName}`,
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
    if (showResults === false && isSubmitting) {
      if (onClose) onClose();
      // If projectId is provided, go to that project's details page, else go to dashboard
      if (projectId) {
        router.push(`/project/${projectId}`);
      } else {
        router.push('/dashboard');
      }
    }
  }, [showResults, isSubmitting]);

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
      if(!showResults) {
        router.push(`/project/${results[0].id}`);
      }
    }
  }, [auth?.user, results]);

  const handleDeliverableChange = (field: string, value: string) => {
    setEditedDeliverables((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleWebsiteAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const productUrl = form.getValues().productUrl.startsWith('http')
        ? form.getValues().productUrl
        : `https://${form.getValues().productUrl}`;
      const response = await fetch('https://n8n-ncsw48oo08gwc0okcwcg0c0c.194.195.92.250.sslip.io/webhook/generate_elevatorPitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prod_url: productUrl, prod_name: form.getValues().productName })
      });
      if (!response.ok) throw new Error('Failed to generate deliverables');
      const data = await response.json();
      setDeliverablesResponse(data.output);
      setEditedDeliverables(data.output);
    } catch (error) {
      setAnalysisError('Something went wrong, please check if your website URL is correct?');
    } finally {
      setIsAnalyzing(false);
    }
  };

  async function onFormSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setLoading(true);
    setError(null);
    setResults([]);
    setCurrentStep(0);
    track('Form Submission', {
      product_name: values.productName,
      has_url: !!values.productUrl,
      user_id: getUserId(),
      timestamp: new Date().toISOString()
    });
    try {
      for (let i = 0; i < progressSteps.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      const response = await fetch('https://n8n-ncsw48oo08gwc0okcwcg0c0c.194.195.92.250.sslip.io/webhook/generate_deliverables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          output: {
            product_name: editedDeliverables?.product_name || values.productName,
            outcome: editedDeliverables?.outcome || '',
            offering: editedDeliverables?.offering || '',
            differentiator: editedDeliverables?.differentiator || '',
            prod_url: values.productUrl,
            cta: values.ask
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
      if (onSubmit) onSubmit(values, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      track('Form Error', {
        error_message: err instanceof Error ? err.message : 'Unknown error',
        user_id: getUserId(),
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
      setCurrentStep(-1);
    }
  }

  const toggleSubreddit = (index: number) => {
    setExpandedSubreddits(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleGoToDashboard = async () => {
    router.push('/dashboard');
  };

  const handleDMChange = (field: 'subject' | 'body', value: string) => {
    setEditedDM(prev => prev ? { ...prev, [field]: value } : null);
  };

  const ProgressLoader = () => {
    if (currentStep === -1) return null;
    return (
      <div className="ff-progress-loader">
        <div className="ff-progress-steps">
          {progressSteps.map((step, index) => (
            <div
              key={index}
              className={`ff-progress-step ${index === currentStep ? 'active' : index < currentStep ? 'completed' : ''}`}
            >
              <div className="ff-progress-dot">
                {index < currentStep ? '✓' : index === currentStep ? '⟳' : ''}
              </div>
              <div className="ff-progress-text">{step}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Get Your First Reddit Leads (Free)
          </h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., EMA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="productUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ask"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intent of Outreach</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full p-2 border rounded">
                        <option value="">Select the intent of outreach</option>
                        <option value="Try the product and provide feedback">Try the product and provide feedback</option>
                        <option value="Sign up for trial">Sign up for trial</option>
                        <option value="Subscribe">Subscribe</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                onClick={handleWebsiteAnalysis}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? 'Analyzing...' : 'Summarize My Product/Business'}
              </Button>
              {analysisError && <p className="text-red-500 mt-4">{analysisError}</p>}
              {deliverablesResponse && (
                <>
                  {/* ... render deliverables ... */}
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Generating...' : 'Get My Leads'}
                  </Button>
                </>
              )}
            </form>
          </Form>

          {error && <p className="text-red-500 mt-4">{error}</p>}
          {loading && <ProgressLoader />}

          {showResults && results.length > 0 && (
            <div className="mt-8">
              <h3 className="text-2xl font-bold mb-4">Results</h3>
              {/* Render your results here */}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RedditDMSection; 