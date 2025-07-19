import React, { useState, useEffect } from 'react';
import { ProjectDetails, SchedulerConfig, ProjectDetailProps } from '../types/project';
import { Slider } from '@mui/material';
import { Switch } from '@mui/material';
import { styled } from '@mui/material/styles';
import { saveProjectDetails, saveSchedulerConfig, getProjectDetails, getSchedulerConfig, getSendHistory } from '../utils/db';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea } from '@/components/ui';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  PaperAirplaneIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CogIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

// Add fetch for Reddit status
const fetchRedditStatus = async (projectId: string) => {
  try {
    const response = await fetch(`/api/projects/reddit-auth?project_id=${projectId}`);
    if (!response.ok) return { reddit_username: null };
    return await response.json();
  } catch {
    return { reddit_username: null };
  }
};

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onClose }) => {
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>({
    productname: '',
    url: '',
    elevatorpitch: '',
    purpose: '',
    subject: '',
    message_copy: '',
    tool_subreddits: '',
  });

  const [schedulerConfig, setSchedulerConfig] = useState<SchedulerConfig>({
    userid: '', // This should be set from your auth context
    project_id: projectId,
    dm_num: 1,
    dm_frequency: 'daily',
    is_enabled: true, // default true, will be set from API
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendHistory, setSendHistory] = useState<Array<{ to: string; status: string; created_date: string }>>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [redditStatus, setRedditStatus] = useState<{ reddit_username: string | null }>({ reddit_username: null });
  const [redditLoading, setRedditLoading] = useState(false);
  // Add state for top subreddits
  const [topSubreddits, setTopSubreddits] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projectData, schedulerData] = await Promise.all([
          getProjectDetails(projectId),
          getSchedulerConfig(projectId)
        ]);

        setProjectDetails(projectData);
        setTopSubreddits(projectData.tool_subreddits.slice(1,-1).split(','));        
        if (schedulerData) {
          setSchedulerConfig({ ...schedulerData, is_enabled: schedulerData.is_enabled ?? true });
        }
        setRedditLoading(true);
        const reddit = await fetchRedditStatus(projectId);
        setRedditStatus(reddit);
        setRedditLoading(false);
      } catch (err) {
        setError('Failed to load project data');
        setRedditLoading(false);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    setShowAllHistory(false); // Reset show more on project change
  }, [projectId]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setHistoryLoading(true);
        const history = await getSendHistory(projectId);
        setSendHistory(history);
      } catch (err) {
        setHistoryError('Failed to load send history');
        console.error(err);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [projectId]);

  const handleProjectDetailsChange = (field: keyof ProjectDetails, value: string) => {
    setProjectDetails(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSchedulerConfigChange = (field: keyof SchedulerConfig, value: any) => {
    setSchedulerConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEnableToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setSchedulerConfig(prev => ({ ...prev, is_enabled: newValue }));
    try {
      await saveSchedulerConfig({ ...schedulerConfig, is_enabled: newValue });
      toast.success(`Scheduler ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update scheduler status');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await Promise.all([
        saveProjectDetails(projectDetails, projectId),
        saveSchedulerConfig(schedulerConfig)
      ]);
      toast.success('Changes saved successfully!');
      // onClose();
    } catch (error) {
      toast.error('Failed to save changes');
      console.error('Error saving:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Project</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Aggregate send history
  const totalMessages = sendHistory.length;
  const successfulMessages = sendHistory.filter(h => h.status === 'success').length;
  const failedMessages = sendHistory.filter(h => h.status !== 'success').length;
  const successRate = totalMessages > 0 ? ((successfulMessages / totalMessages) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-center" autoClose={3000} />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{projectDetails.productname || 'Project Details'}</h1>
              <p className="text-gray-600 mt-1">Project ID: {projectId}</p>
            </div>
            <Button onClick={handleSave} disabled={loading} variant="default">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="transform transition-all duration-200 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <PaperAirplaneIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Sent</p>
                  <p className="text-2xl font-bold text-gray-900">{totalMessages}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transform transition-all duration-200 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Successful</p>
                  <p className="text-2xl font-bold text-gray-900">{successfulMessages}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transform transition-all duration-200 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-gray-900">{failedMessages}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transform transition-all duration-200 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{successRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Project Details & Configuration */}
          <div className="lg:col-span-2 space-y-6">
                        {/* Configuration */}
                        <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CogIcon className="h-5 w-5 mr-2" />
                  Automation Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Enable Automated DMs</h3>
                    <p className="text-sm text-gray-600">Automatically send messages based on your schedule</p>
                  </div>
                  <Switch
                    checked={!!schedulerConfig.is_enabled}
                    onChange={handleEnableToggle}
                    color="primary"
                    inputProps={{ 'aria-label': 'Enable Scheduler' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of DMs per day: {schedulerConfig.dm_num}
                  </label>
                  <Slider
                    value={schedulerConfig.dm_num}
                    onChange={(_, value) => handleSchedulerConfigChange('dm_num', value)}
                    min={1}
                    max={10}
                    marks
                    valueLabelDisplay="auto"
                    className="mt-4"
                  />
                </div>
              </CardContent>
            </Card>
            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CogIcon className="h-5 w-5 mr-2" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                    <Input
                      value={projectDetails.productname}
                      onChange={(e) => handleProjectDetailsChange('productname', e.target.value)}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
                    <Input
                      value={projectDetails.url}
                      onChange={(e) => handleProjectDetailsChange('url', e.target.value)}
                      placeholder="https://yourproduct.com"
                    />
                  </div>
                </div>
                
                                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Message Subject</label>
                   <Input
                     value={projectDetails.subject}
                     onChange={(e) => handleProjectDetailsChange('subject', e.target.value)}
                     placeholder="Subject line for your messages..."
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Message Copy</label>
                   <Textarea
                     value={projectDetails.message_copy}
                     onChange={(e) => handleProjectDetailsChange('message_copy', e.target.value)}
                     placeholder="Write your message template. Use {username} to personalize..."
                     rows={8}
                   />
                 </div>
              </CardContent>
            </Card>

            {/* Send History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                  Send History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  </div>
                ) : historyError ? (
                  <div className="text-center py-8">
                    <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600">{historyError}</p>
                  </div>
                ) : sendHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <PaperAirplaneIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No send history found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(showAllHistory ? sendHistory : sendHistory.slice(0, 10)).map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.to}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                row.status === 'success' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {row.status === 'success' ? (
                                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                                ) : (
                                  <XCircleIcon className="h-3 w-3 mr-1" />
                                )}
                                {row.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(row.created_date).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {sendHistory.length > 10 && (
                      <div className="mt-4 text-center">
                        <Button
                          variant="outline"
                          onClick={() => setShowAllHistory(!showAllHistory)}
                        >
                          {showAllHistory ? 'Show Less' : 'Show More'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Reddit Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LinkIcon className="h-5 w-5 mr-2" />
                  Reddit Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                {redditLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  </div>
                ) : redditStatus.reddit_username ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-800">Connected</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        u/{redditStatus.reddit_username}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const clientId = process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID;
                        const redirectUri = process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI;
                        if (!clientId || !redirectUri) {
                          alert('Reddit API client ID or redirect URI is not configured.');
                          return;
                        }
                        const randomState = Math.random().toString(36).substring(2, 15);
                        document.cookie = `reddit_oauth_state=${randomState}; max-age=600; path=/`;
                        document.cookie = `project_id=${projectId}; max-age=600; path=/`;
                        const scope = 'identity privatemessages'.replace(' ', ',');
                        const authUrl = `https://www.reddit.com/api/v1/authorize?client_id=${clientId}&response_type=code&state=${randomState}&redirect_uri=${encodeURIComponent(redirectUri)}&duration=permanent&scope=${encodeURIComponent(scope)}`;
                        window.location.href = authUrl;
                      }}
                      className="w-full"
                    >
                      Reconnect Account
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                        <span className="text-sm font-medium text-yellow-800">Not Connected</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        Connect your Reddit account to start sending messages
                      </p>
                    </div>
                    <Button
                      variant="reddit"
                      onClick={() => {
                        const clientId = process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID;
                        const redirectUri = process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI;
                        if (!clientId || !redirectUri) {
                          alert('Reddit API client ID or redirect URI is not configured.');
                          return;
                        }
                        const randomState = Math.random().toString(36).substring(2, 15);
                        document.cookie = `reddit_oauth_state=${randomState}; max-age=600; path=/`;
                        document.cookie = `project_id=${projectId}; max-age=600; path=/`;
                        const scope = 'identity privatemessages'.replace(' ', ',');
                        const authUrl = `https://www.reddit.com/api/v1/authorize?client_id=${clientId}&response_type=code&state=${randomState}&redirect_uri=${encodeURIComponent(redirectUri)}&duration=permanent&scope=${encodeURIComponent(scope)}`;
                        window.location.href = authUrl;
                      }}
                      className="w-full"
                    >
                      Connect Reddit Account
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Subreddits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserGroupIcon className="h-5 w-5 mr-2" />
                  Target Subreddits
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  </div>
                ) : error ? (
                  <div className="text-center py-4">
                    <XCircleIcon className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                ) : topSubreddits.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <UserGroupIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No subreddits found.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topSubreddits.map((sub, idx) => (
                      <a
                        key={idx}
                        href={`https://reddit.com/${sub}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                      >
                        <div className="flex items-center">
                          <LinkIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900">r/{sub}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail; 