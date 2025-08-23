import React, { useState, useEffect } from 'react';
import { Button, Input, Textarea, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { PaperAirplaneIcon, LinkIcon, ClockIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface RedditPostFormProps {
  projectId: string;
}

interface RedditPostHistory {
  id: string;
  project_id: string;
  interaction_type: string;
  from: string;
  to: string;
  created_date: string;
  subject: string;
  message: string;
  status_display: string;
  url: string;
}

interface RedditPostStats {
  total_posts: number;
  successful_posts: number;
  failed_posts: number;
  pending_posts: number;
  processing_posts: number;
  last_post_date: string | null;
}

const RedditPostForm: React.FC<RedditPostFormProps> = ({ projectId }) => {
  const [subreddit, setSubreddit] = useState('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; redditLink: string } | null>(null);
  const [postHistory, setPostHistory] = useState<RedditPostHistory[]>([]);
  const [postStats, setPostStats] = useState<RedditPostStats | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const resetForm = () => {
    setSubreddit('');
    setTitle('');
    setText('');
    setImage(null);
    setError(null);
    setSuccess(null);
  };

  const fetchRedditPostHistory = async () => {
    if (!projectId) return;
    
    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/send-history?type=reddit_post`);
      if (!response.ok) {
        throw new Error('Failed to fetch Reddit post history');
      }
      
      const data = await response.json();
      setPostHistory(data.history || []);
      setPostStats(data.stats || null);
    } catch (err) {
      console.error('Error fetching Reddit post history:', err);
      setError('Failed to load Reddit post history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch Reddit post history on component mount and when projectId changes
  useEffect(() => {
    fetchRedditPostHistory();
  }, [projectId]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'posted successfully':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <ExclamationTriangleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('Image file size must be less than 5MB.');
        return;
      }
      
      setImage(file);
      setError(null); // Clear any previous errors
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    

    try {
          // Validate form data before submission
    if (!projectId) {
      setError('Project ID is required.');
      setLoading(false);
      return;
    }
    
    if (!subreddit.trim()) {
      setError('Please enter a subreddit name.');
      setLoading(false);
      return;
    }
    
    if (!title.trim()) {
      setError('Please enter a post title.');
      setLoading(false);
      return;
    }
    
    if (title.trim().length < 5) {
      setError('Post title must be at least 5 characters long.');
      setLoading(false);
      return;
    }
    
    if (title.trim().length > 300) {
      setError('Post title must be less than 300 characters.');
      setLoading(false);
      return;
    }
    
    if (!text.trim()) {
      setError('Please enter post content.');
      setLoading(false);
      return;
    }
    
    if (text.trim().length < 10) {
      setError('Post content must be at least 10 characters long.');
      setLoading(false);
      return;
    }
    
    if (text.trim().length > 40000) {
      setError('Post content must be less than 40,000 characters.');
      setLoading(false);
      return;
    }

    // Encode subreddit name properly (remove 'r/' prefix if present and validate)
    const cleanSubreddit = subreddit.replace(/^r\//, '').trim();
    if (cleanSubreddit.length < 3) {
      setError('Subreddit name must be at least 3 characters long.');
      setLoading(false);
      return;
    }
    
    // Create properly encoded FormData with sanitized data
    const formData = new FormData();
    formData.append('subreddit', cleanSubreddit);
    formData.append('title', title.trim().replace(/\s+/g, ' ')); // Remove extra whitespace
    formData.append('text', text.trim().replace(/\s+/g, ' ')); // Remove extra whitespace
    formData.append('project_id', projectId);
    if (image) {
      formData.append('image', image);
    }
    
    // Log the form data for debugging (remove in production)
    console.log('Submitting form data:', {
      subreddit: cleanSubreddit,
      title: title.trim(),
      textLength: text.trim().length,
      projectId,
      hasImage: !!image,
      imageSize: image ? `${(image.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'
    });

      const response = await fetch('https://ema-dm-scheduler-641923045318.us-central1.run.app/create_reddit_post', {
        method: 'POST',
        headers: {
          'X-Token': 'ABC',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use the text as error message
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success) {
        setSuccess({ message: result.message, redditLink: result.data.reddit_link });
        // Don't reset form immediately - let user see the success message and access the link
        // Only clear the form fields, keep success state
        setSubreddit('');
        setTitle('');
        setText('');
        setImage(null);
        setError(null);
        
        // Refresh the Reddit post history to show the new post
        fetchRedditPostHistory();
      } else {
        setError(result.message || 'Failed to create Reddit post.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while submitting the post.';
      setError(errorMessage);
      console.error('Form submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <PaperAirplaneIcon className="h-5 w-5 mr-2" />
          Create Reddit Post
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subreddit</label>
            <Input
              value={subreddit}
              onChange={(e) => {
                // Remove any invalid characters and ensure proper format
                const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                setSubreddit(value);
              }}
              placeholder="e.g., yoursubreddit (without r/)"
              required
            />
            {subreddit && (
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-500">
                  Will post to: r/{subreddit}
                </span>
                <span className={subreddit.length < 3 ? 'text-red-500' : 'text-green-500'}>
                  {subreddit.length < 3 ? 'Too short' : 'Valid'}
                </span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
              required
              maxLength={300}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Minimum 5 characters</span>
              <span>{title.length}/300</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Text</label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Post content"
              rows={6}
              required
              maxLength={40000}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Minimum 10 characters</span>
              <span>{text.length}/40,000</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image (Optional)</label>
            <Input
              type="file"
              onChange={handleImageChange}
              accept="image/*"
            />
            {image && (
              <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                <span>Selected: {image.name}</span>
                <span>Size: {(image.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Accepted formats: JPG, PNG, GIF. Max size: 5MB
            </p>
          </div>
          <div className="flex space-x-3">
                      <Button type="submit" disabled={loading} loading={loading} className="flex-1">
            {loading ? 'Submitting...' : 'Submit Post'}
          </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={resetForm}
              disabled={loading}
              className="px-4"
            >
              Reset
            </Button>
          </div>
        </form>
        {error && <p className="mt-4 text-red-600">{error}</p>}
        {success && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-800">Post Created Successfully!</h3>
            </div>
            <p className="text-green-700 mb-4">
              {success.message}
              <span className="block text-sm text-green-600 mt-1">
                Your post has been submitted to Reddit and is now live!
              </span>
            </p>
            <div className="flex items-center space-x-3">
              <a 
                href={success.redditLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors duration-200"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                View on Reddit
              </a>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setSuccess(null);
                  resetForm();
                }}
                className="text-sm"
              >
                Create Another Post
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={fetchRedditPostHistory}
                className="text-sm"
              >
                Refresh History
              </Button>
            </div>
          </div>
        )}

        {/* Reddit Post History Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Reddit Post History</h3>
            <Button 
              type="button" 
              variant="outline" 
              onClick={fetchRedditPostHistory}
              disabled={historyLoading}
              className="text-sm"
            >
              {historyLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          {/* Statistics Cards */}
          {postStats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{postStats.total_posts}</div>
                <div className="text-sm text-blue-700">Total Posts</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{postStats.successful_posts}</div>
                <div className="text-sm text-green-700">Successful</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">{postStats.pending_posts}</div>
                <div className="text-sm text-yellow-700">Pending</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">{postStats.failed_posts}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{postStats.processing_posts}</div>
                <div className="text-sm text-blue-700">Processing</div>
              </div>
            </div>
          )}

          {/* Latest Successful Post Link */}
          {postHistory.length > 0 && postHistory.find(post => post.url && post.status_display.toLowerCase() === 'posted successfully') && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-orange-800 mb-1">Latest Successful Post</h4>
                  <p className="text-xs text-orange-600">Click below to view your most recent Reddit post</p>
                </div>
                <LinkIcon className="h-5 w-5 text-orange-500" />
              </div>
              <div className="mt-2">
                {(() => {
                  const latestSuccessfulPost = postHistory.find(post => 
                    post.url && post.status_display.toLowerCase() === 'posted successfully'
                  );
                  return latestSuccessfulPost ? (
                    <a 
                      href={latestSuccessfulPost.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-orange-700 hover:text-orange-800 font-medium underline hover:no-underline transition-colors duration-200"
                    >
                      <LinkIcon className="h-4 w-4 mr-1" />
                      {latestSuccessfulPost.subject || 'View Latest Post'}
                    </a>
                  ) : null;
                })()}
              </div>
            </div>
          )}

          {/* History List */}
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading history...</span>
            </div>
          ) : postHistory.length > 0 ? (
            <div className="space-y-4">
              {postHistory.map((post) => (
                <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(post.status_display)}
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                          post.status_display.toLowerCase() === 'posted successfully' 
                            ? 'bg-green-100 text-green-800'
                            : post.status_display.toLowerCase() === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : post.status_display.toLowerCase() === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {post.status_display}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(post.created_date)}
                        </span>
                        
                        {/* Reddit URL Badge for Successful Posts */}
                        {post.url && post.status_display.toLowerCase() === 'posted successfully' && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                            <LinkIcon className="h-3 w-3 mr-1" />
                            Live
                          </span>
                        )}
                      </div>
                      
                      <h4 className="font-medium text-gray-900 mb-1 truncate">
                        {post.subject || 'No Title'}
                      </h4>
                      
                      {/* Reddit URL Display */}
                      {post.url && (
                        <div className="mb-2">
                          <a 
                            href={post.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-orange-600 hover:text-orange-700 font-medium"
                          >
                            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                            </svg>
                            {post.url}
                          </a>
                        </div>
                      )}
                      
                      {post.message && (
                        <p className="text-sm text-gray-600 mb-2 overflow-hidden text-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                          {post.message}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>ID: {post.id}</span>
                        {post.to && <span>To: {post.to}</span>}
                      </div>
                      
                      {/* Reddit Post URL Link */}
                      {post.url && (
                        <div className="mt-2 flex items-center space-x-3">
                          <a 
                            href={post.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700 underline hover:no-underline transition-colors duration-200"
                          >
                            <LinkIcon className="h-4 w-4 mr-1" />
                            View on Reddit
                          </a>
                          
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(post.url);
                              // You could add a toast notification here
                            }}
                            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
                            title="Copy URL to clipboard"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <PaperAirplaneIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p>No Reddit posts found for this project.</p>
              <p className="text-sm">Create your first post above to get started!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RedditPostForm;
