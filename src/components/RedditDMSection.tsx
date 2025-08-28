import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  Form,
  FormField,
} from "@/components/ui";
import { GlobeAltIcon, BoltIcon, PlayIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/firebase/AuthContext";
import { track, getUserId } from "@/utils/mixpanel";
import { useRouter } from "next/navigation";
import { normalizeUrl } from "../utils/normalizeUrl";

export interface RedditDMSectionProps {
  initialFields?: {
    productName?: string;
    productUrl?: string;
    ask?: string;
  };
  mode?: "create" | "edit";
  onSubmit?: (fields: any, results: any) => void;
  showResults?: boolean;
}

export const RedditDMSection: React.FC<
  RedditDMSectionProps & { onClose?: () => void; projectId?: string }
> = ({
  initialFields = {},
  mode = "create",
  onSubmit,
  showResults = true,
  onClose,
  projectId,
}) => {
  const [fields, setFields] = useState({
    productName: initialFields.productName || "",
    productUrl: initialFields.productUrl || "",
    ask: initialFields.ask || "",
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [expandedSubreddits, setExpandedSubreddits] = useState<number[]>([]);
  const [editedDM, setEditedDM] = useState<{
    subject: string;
    body: string;
  } | null>(null);
  const auth = useAuth();
  const router = useRouter();

  const progressSteps = [
    `Extracting additional keywords for ${fields.productName}`,
    `Finding top subreddits for ${fields.productName}`,
    `Finding top redditors for ${fields.productName}`,
    `Composing reddit engagement DM for ${fields.productName}`,
    "Packaging results...",
  ];

  useEffect(() => {
    const lastResult = results[results.length - 1];
    if (lastResult?.output) {
      setEditedDM({
        subject: lastResult.output.subject || "",
        body: lastResult.output.body || "",
      });
    }
  }, [results]);

  useEffect(() => {
    if (showResults === false && results.length > 0) {
      if (onClose) onClose();
      if (projectId) {
        router.push(`/project/${projectId}`);
      } else {
        router.push("/dashboard");
      }
    }
  }, [showResults, results, onClose, projectId, router]);

  const updateUserIdInDatabase = async (id: string) => {
    try {
      const response = await fetch("/api/update-user-id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user ID");
      }

      track("User ID Updated", {
        user_id: getUserId(),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating user ID:", error);
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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validateFields = () => {
      if (!fields.productName.trim()) {
        alert("Please enter your business/product name");
        return false;
      }
      if (!fields.productUrl.trim()) {
        alert("Please enter your product/website URL");
        return false;
      }
      if (!fields.ask.trim()) {
        alert("Please select the intent of outreach");
        return false;
      }
      return true;
    };

    if (!validateFields()) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setCurrentStep(0);

    track("Form Submission", {
      product_name: fields.productName,
      has_url: !!fields.productUrl,
      user_id: getUserId(),
      timestamp: new Date().toISOString(),
    });

    try {
      // Simulate progress steps
      for (let i = 0; i < progressSteps.length; i++) {
        setCurrentStep(i);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const response = await fetch(
        "https://n8n-ncsw48oo08gwc0okcwcg0c0c.194.195.92.250.sslip.io/webhook/generate_deliverables",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            output: {
              product_name: fields.productName,
              outcome: "",
              offering: "",
              differentiator: "",
              prod_url: fields.productUrl,
              cta: fields.ask,
            },
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to fetch results");

      const data = await response.json();
      setResults(data);

      track("Results Generated", {
        has_subreddits: data.length > 0,
        has_message: !!data[data.length - 1]?.output,
        user_id: getUserId(),
        timestamp: new Date().toISOString(),
      });

      if (onSubmit) onSubmit(fields, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      track("Form Error", {
        error_message: err instanceof Error ? err.message : "Unknown error",
        user_id: getUserId(),
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
      setCurrentStep(-1);
    }
  };

  const toggleSubreddit = (index: number) => {
    setExpandedSubreddits((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleDMChange = (field: "subject" | "body", value: string) => {
    setEditedDM((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleSendToLeads = () => {
    if (!auth?.user) {
      // Show login popup by triggering sign in
      auth?.signInWithGoogle();
    } else {
      // User is signed in, redirect to dashboard
      router.push("/dashboard");
    }
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
                index === currentStep
                  ? "bg-blue-50 text-blue-700"
                  : index < currentStep
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-50 text-gray-500"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                  index < currentStep
                    ? "bg-green-500 text-white"
                    : index === currentStep
                    ? "bg-blue-500 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {index < currentStep
                  ? "✓"
                  : index === currentStep
                  ? "⟳"
                  : index + 1}
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
            Experience The MAGIC!
          </h2>
        </div>

        <Card>
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
                {/* Top Subreddits Section */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Top Subreddits
                  </h2>
                  <div className="space-y-4">
                    {results.map((result, index) => {
                      if (index === results.length - 1) return null;
                      if (index === 0) return null;
                      const isExpanded = expandedSubreddits.includes(index);
                      const potentialCustomers =
                        result.top_authors?.length || 0;
                      const shouldBlur = !auth?.user && index >= 2;

                      if (index === 2 && !auth?.user) {
                        return (
                          <div
                            key="signin-prompt"
                            className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg"
                          >
                            <Button
                              onClick={() => auth?.signInWithGoogle()}
                              className="flex items-center space-x-2 mx-auto"
                            >
                              <img
                                src="/google-icon.svg"
                                alt="Google"
                                className="w-5 h-5"
                              />
                              <span>
                                Sign in with Google to view all subreddits
                              </span>
                            </Button>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={index}
                          className={`border border-gray-200 rounded-lg ${
                            shouldBlur
                              ? "opacity-50"
                              : "hover:border-blue-300 hover:bg-blue-50"
                          } transition-all duration-200`}
                        >
                          <div
                            className="p-4 cursor-pointer"
                            onClick={() =>
                              !shouldBlur && toggleSubreddit(index)
                            }
                            style={{
                              cursor: shouldBlur ? "not-allowed" : "pointer",
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">
                                  <a
                                    href={`https://reddit.com${result.display_name_prefixed}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-blue-600"
                                  >
                                    {result.display_name_prefixed}
                                  </a>
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  Found {potentialCustomers} leads from recently
                                  active users
                                </p>
                              </div>
                              {!shouldBlur && (
                                <div className="text-2xl font-bold text-gray-400 hover:text-gray-600">
                                  {isExpanded ? "−" : "+"}
                                </div>
                              )}
                            </div>
                          </div>

                          {isExpanded && !shouldBlur && (
                            <div className="px-4 pb-4 border-t border-gray-100">
                              <div className="pt-4 space-y-4">
                                <div>
                                  <p className="text-sm text-gray-600">
                                    {result.subscribers?.toLocaleString() ||
                                      "N/A"}{" "}
                                    subscribers
                                  </p>
                                  <p className="text-sm text-gray-700 mt-2">
                                    {result.description}
                                  </p>
                                </div>

                                {result.top_authors &&
                                  result.top_authors.length > 0 && (
                                    <div>
                                      <h4 className="font-medium text-gray-900 mb-3">
                                        Top Users
                                      </h4>
                                      <div className="space-y-3">
                                        {result.top_authors.map(
                                          (author: any, idx: number) => (
                                            <div
                                              key={idx}
                                              className="p-3 bg-gray-50 rounded-lg"
                                            >
                                              <div className="space-y-2">
                                                <a
                                                  href={author.profile_url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="font-medium text-blue-600 hover:text-blue-800"
                                                >
                                                  {author.author.replace(
                                                    "t2_",
                                                    ""
                                                  )}
                                                </a>
                                                <p className="text-sm text-gray-700">
                                                  {author.top_post_title}
                                                </p>
                                                <a
                                                  href={author.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-sm text-blue-600 hover:text-blue-800"
                                                >
                                                  View Post →
                                                </a>
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Message Section */}
                {results[results.length - 1]?.output && (
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="mb-4">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        AI-generated Reddit DM template
                      </h2>
                      <p className="text-gray-600">
                        We're building automated Reddit DM campaigns that target
                        your best-fit audience. Join the waitlist to be the
                        first to know when we launch. For now, you can test this
                        personalized DM by providing your Reddit handle below.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {editedDM !== null && (
                        <>
                          <div>
                            <label
                              htmlFor="dm-subject"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Subject
                            </label>
                            <textarea
                              id="dm-subject"
                              value={editedDM.subject || ""}
                              onChange={(e) =>
                                handleDMChange("subject", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              rows={2}
                              placeholder="Enter DM subject"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="dm-body"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Message
                            </label>
                            <textarea
                              id="dm-body"
                              value={editedDM.body || ""}
                              onChange={(e) =>
                                handleDMChange("body", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              rows={8}
                              placeholder="Enter DM message"
                            />
                          </div>
                        </>
                      )}

                      {editedDM === null && (
                        <div
                          className={`space-y-4 ${
                            !auth?.user ? "relative" : ""
                          }`}
                        >
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Subject
                            </h4>
                            <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                              Loading...
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Message
                            </h4>
                            <div className="relative">
                              <p className="text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                                Loading...
                              </p>
                              {!auth?.user && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-md flex items-center justify-center">
                                  <div className="text-center">
                                    <h3 className="font-medium text-gray-900 mb-3">
                                      Sign in to view full message
                                    </h3>
                                    <Button
                                      onClick={() => auth?.signInWithGoogle()}
                                      className="flex items-center space-x-2"
                                    >
                                      <img
                                        src="/google-icon.svg"
                                        alt="Google"
                                        className="w-5 h-5"
                                      />
                                      <span>Sign in with Google</span>
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-center space-x-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setResults([])}
                    className="transition-all duration-200 hover:scale-105"
                  >
                    Start Over
                  </Button>
                  <Button
                    variant="reddit"
                    onClick={handleSendToLeads}
                    className="transition-all duration-200 hover:scale-105"
                  >
                    Send to Leads
                  </Button>
                </div>
              </div>
            ) : (
              <Form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    name="productUrl"
                    value={fields.productUrl}
                    onChange={handleChange}
                    placeholder="Paste your product URL here"
                    required
                    leftIcon={
                      <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                    }
                    className="form-input-custom transition-all duration-200 focus:ring-0 focus:outline-none border-0 bg-gray-50 rounded-lg h-12 shadow-sm"
                  />
                </div>

                <div>
                  <Input
                    name="productName"
                    value={fields.productName}
                    onChange={handleChange}
                    placeholder="And your product name"
                    required
                    leftIcon={<BoltIcon className="h-5 w-5 text-gray-400" />}
                    className="form-input-custom transition-all duration-200 focus:ring-0 focus:outline-none border-0 bg-gray-50 rounded-lg h-12 shadow-sm"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-orange-600 font-jost  hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-full transition-all duration-200 hover:scale-105"
                  >
                    {loading ? "Processing..." : "Unlock Your Reddit Market"}
                  </Button>

                  <div className="flex flex-col text-xs text-gray-600">
                    <span>Free to try</span>
                    <span>No CC required.</span>
                  </div>
                </div>

                <div className="flex items-center justify-center pt-2">
                  <button
                    type="button"
                    className="flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors duration-200"
                    onClick={() => {
                      // You can add the action for watching the demo here
                      console.log("Watch EMA in Action clicked");
                    }}
                  >
                    <PlayIcon className="h-4 w-4 mr-1" />
                    Or Watch EMA in Action
                  </button>
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
