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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('subreddit', subreddit);
    formData.append('title', title);
    formData.append('text', text);
    formData.append('project_id', projectId);
    if (image) {
      formData.append('image', image);
    }

    try {
      const response = await fetch('https://ema-dm-scheduler-641923045318.us-central1.run.app/create_reddit_post', {
        method: 'POST',
        headers: {
          'X-Token': '64ff35d08f4724dc0c1e0be8cdc6c46faaf004f545dde1c429fd4c8ea576afee',
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess({ message: result.message, redditLink: result.data.reddit_link });
        // Clear form
        setSubreddit('');
        setTitle('');
        setText('');
        setImage(null);
      } else {
        setError(result.message || 'Failed to create Reddit post.');
      }
    } catch (err) {
      setError('An error occurred while submitting the post.');
      console.error(err);
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
              onChange={(e) => setSubreddit(e.target.value)}
              placeholder="e.g., r/yoursubreddit"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Text</label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Post content"
              rows={6}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image (Optional)</label>
            <Input
              type="file"
              onChange={handleImageChange}
              accept="image/*"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Submitting...' : 'Submit Post'}
          </Button>
        </form>
        {error && <p className="mt-4 text-red-600">{error}</p>}
        {success && (
          <div className="mt-4 text-green-600">
            <p>{success.message}</p>
            <a href={success.redditLink} target="_blank" rel="noopener noreferrer" className="flex items-center underline">
              <LinkIcon className="h-4 w-4 mr-1" />
              View Post
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RedditPostForm;
