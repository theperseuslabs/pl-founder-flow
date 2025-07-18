'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/firebase/AuthContext';
import { useRouter } from 'next/navigation';
import { ProjectDetails, SchedulerConfig } from '@/types/project';
import { Slider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { saveProjectDetails, saveSchedulerConfig, getProjectDetails, getSchedulerConfig, getSendHistory } from '@/utils/db';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Switch } from '@mui/material';

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

const BackButton = styled('button')({
  backgroundColor: 'transparent',
  color: '#666',
  padding: '8px 16px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '16px',
  '&:hover': {
    backgroundColor: '#f5f5f5',
  },
});

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const auth = useAuth();
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
    project_id: params.id,
    dm_num: 1,
    dm_frequency: 'daily',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [redditStatus, setRedditStatus] = useState<{ reddit_username: string | null }>({ reddit_username: null });
  const [redditLoading, setRedditLoading] = useState(false);
  const [sendHistory, setSendHistory] = useState<Array<{ to: string; status: string; created_date: string }>>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projectData, schedulerData] = await Promise.all([
          getProjectDetails(params.id),
          getSchedulerConfig(params.id)
        ]);

        setProjectDetails(projectData);
        if (schedulerData) {
          setSchedulerConfig(schedulerData);
        }
        setRedditLoading(true);
        const reddit = await fetchRedditStatus(params.id);
        setRedditStatus(reddit);
        setRedditLoading(false);
        // Fetch send history
        setHistoryLoading(true);
        const history = await getSendHistory(params.id);
        setSendHistory(history);
        setHistoryLoading(false);
      } catch (err) {
        setError('Failed to load project data');
        setRedditLoading(false);
        setHistoryError('Failed to load send history');
        setHistoryLoading(false);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (auth?.user) {
      fetchData();
    }
  }, [params.id, auth?.user]);

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

  const handleSave = async () => {
    try {
      setSaving(true);
      await Promise.all([
        saveProjectDetails(projectDetails, params.id),
        saveSchedulerConfig(schedulerConfig)
      ]);
      toast.success('Changes saved successfully!');
      // router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to save changes');
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  // Enable toggle handler
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

  // Aggregate send history
  const totalMessages = sendHistory.length;
  const successfulMessages = sendHistory.filter(h => h.status === 'success').length;
  const failedMessages = sendHistory.filter(h => h.status !== 'success').length;

  if (!auth?.user) {
    return (
      <Container>
        <div>Please sign in to view this page.</div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <div className="loading-spinner">
          <div></div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div>Error: {error}</div>
      </Container>
    );
  }

  return (
    <Container>
      <ToastContainer position="top-center" autoClose={3000} />
      <BackButton onClick={() => router.push('/dashboard')}>
        ← Back to Dashboard
      </BackButton>
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
          <Input
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
        <FormGroup>
          <Label>Frequency</Label>
          <div style={{ fontWeight: 500, padding: '8px 0' }}>Daily</div>
        </FormGroup>
      </Section>
      {/* Success/Error message */}
      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </Container>
  );
} 