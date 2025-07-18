import React, { useState, useEffect } from 'react';
import { ProjectDetails, SchedulerConfig, ProjectDetailProps } from '../types/project';
import { Slider } from '@mui/material';
import { Switch } from '@mui/material';
import { styled } from '@mui/material/styles';
import { saveProjectDetails, saveSchedulerConfig, getProjectDetails, getSchedulerConfig, getSendHistory } from '../utils/db';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

const Container = styled('div')({
  padding: '24px',
  maxWidth: '800px',
  margin: '0 auto',
});

const Section = styled('div')({
  marginBottom: '32px',
  padding: '20px',
  borderRadius: '8px',
  backgroundColor: '#fff',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
});

const Title = styled('h2')({
  marginBottom: '16px',
  color: '#333',
});

const FormGroup = styled('div')({
  marginBottom: '16px',
});

const Label = styled('label')({
  display: 'block',
  marginBottom: '8px',
  fontWeight: '500',
});

const Input = styled('input')({
  width: '100%',
  padding: '8px',
  borderRadius: '4px',
  border: '1px solid #ddd',
  marginBottom: '8px',
});

const TextArea = styled('textarea')({
  width: '100%',
  padding: '8px',
  borderRadius: '4px',
  border: '1px solid #ddd',
  minHeight: '100px',
  marginBottom: '8px',
});

const Select = styled('select')({
  width: '100%',
  padding: '8px',
  borderRadius: '4px',
  border: '1px solid #ddd',
  marginBottom: '8px',
});

const Button = styled('button')({
  backgroundColor: '#007bff',
  color: 'white',
  padding: '10px 20px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: '#0056b3',
  },
});

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onClose }) => {
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>({
    productname: '',
    url: '',
    elevatorpitch: '',
    purpose: '',
    subject: '',
    message_copy: '',
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projectData, schedulerData] = await Promise.all([
          getProjectDetails(projectId),
          getSchedulerConfig(projectId)
        ]);

        setProjectDetails(projectData);
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
    return <Container>Loading...</Container>;
  }

  if (error) {
    return <Container>Error: {error}</Container>;
  }

  // Aggregate send history
  const totalMessages = sendHistory.length;
  const successfulMessages = sendHistory.filter(h => h.status === 'success').length;
  const failedMessages = sendHistory.filter(h => h.status !== 'success').length;

  return (
    <Container>
      <ToastContainer position="top-center" autoClose={3000} />
      {/* Summary Section */}
      <Section style={{ marginBottom: 24, background: '#f8fafc', border: '1px solid #e5e7eb' }}>
        <Title>Summary</Title>
        {historyLoading ? (
          <div>Loading summary...</div>
        ) : historyError ? (
          <div style={{ color: 'red' }}>{historyError}</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div><b>Total Sent:</b> {totalMessages}</div>
            <div><b>Successful:</b> {successfulMessages}</div>
            <div><b>Failed:</b> {failedMessages}</div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 500 }}>Enable</span>
              <Switch
                checked={!!schedulerConfig.is_enabled}
                onChange={handleEnableToggle}
                color="primary"
                inputProps={{ 'aria-label': 'Enable Scheduler' }}
              />
            </div>
          </div>
        )}
      </Section>
      {/* ... existing Product Details section ... */}
      <Section>
        <Title>Product Details</Title>
        <FormGroup>
          <Label>Product Name</Label>
          <Input
            value={projectDetails.productname}
            onChange={(e) => handleProjectDetailsChange('productname', e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <Label>URL</Label>
          <Input
            value={projectDetails.url}
            onChange={(e) => handleProjectDetailsChange('url', e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <Label>Elevator Pitch</Label>
          <TextArea
            value={projectDetails.elevatorpitch}
            onChange={(e) => handleProjectDetailsChange('elevatorpitch', e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <Label>Purpose</Label>
          <Input
            value={projectDetails.purpose}
            onChange={(e) => handleProjectDetailsChange('purpose', e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <Label>Subject</Label>
          <TextArea
            value={projectDetails.subject}
            onChange={(e) => handleProjectDetailsChange('subject', e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <Label>Message Copy</Label>
          <TextArea
            value={projectDetails.message_copy}
            onChange={(e) => handleProjectDetailsChange('message_copy', e.target.value)}
          />
        </FormGroup>
      </Section>
      <Section>
        <Title>Configure</Title>
        <FormGroup>
          <Label>Number of DMs</Label>
          <Slider
            value={schedulerConfig.dm_num}
            onChange={(_, value) => handleSchedulerConfigChange('dm_num', value)}
            min={1}
            max={10}
            marks
            valueLabelDisplay="auto"
          />
        </FormGroup>
        {/* Success/Error message */}
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </Section>
      {/* Reddit Button and Status */}
      <Section>
        <Title>Reddit Integration</Title>
        {redditLoading ? (
          <div>Loading Reddit status...</div>
        ) : redditStatus.reddit_username ? (
          <>
            <div style={{ marginBottom: 8, color: 'gray', fontWeight: 500 }}>
              Connected as: <b>u/{redditStatus.reddit_username}</b>
            </div>
            <button
              style={{ background: '#ff4500', color: 'white', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', marginBottom: 8 }}
              onClick={() => {
                // Reconnect logic: redirect to Reddit OAuth
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
            >Reconnect Reddit Account</button>
          </>
        ) : (
          <button
            style={{ background: '#ff4500', color: 'white', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', marginBottom: 8 }}
            onClick={() => {
              // Connect logic: redirect to Reddit OAuth
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
          >Connect Reddit Account</button>
        )}
      </Section>
      {/* ... existing Send History section ... */}
      <Section>
        <Title>Send History</Title>
        {historyLoading ? (
          <div>Loading...</div>
        ) : historyError ? (
          <div>Error: {historyError}</div>
        ) : sendHistory.length === 0 ? (
          <div>No send history found.</div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>To</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Status</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {(showAllHistory ? sendHistory : sendHistory.slice(0, 10)).map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>{row.to}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>{row.status}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>{new Date(row.created_date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sendHistory.length > 10 && !showAllHistory && (
              <button style={{ marginTop: '12px' }} onClick={() => setShowAllHistory(true)}>
                Show More
              </button>
            )}
            {showAllHistory && sendHistory.length > 10 && (
              <button style={{ marginTop: '12px' }} onClick={() => setShowAllHistory(false)}>
                Show Less
              </button>
            )}
          </>
        )}
      </Section>
    </Container>
  );
};

export default ProjectDetail; 