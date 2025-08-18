import React, { useState } from 'react';
import { Button, Input, Textarea, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { PaperAirplaneIcon, LinkIcon } from '@heroicons/react/24/outline';

interface RedditPostFormProps {
  projectId: string;
}

const RedditPostForm: React.FC<RedditPostFormProps> = ({ projectId }) => {
  const [subreddit, setSubreddit] = useState('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; redditLink: string } | null>(null);

  const resetForm = () => {
    setSubreddit('');
    setTitle('');
    setText('');
    setImage(null);
    setError(null);
    setSuccess(null);
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

      const response = await fetch('http://localhost:8080', {
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
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RedditPostForm;
