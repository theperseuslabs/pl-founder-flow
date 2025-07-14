import React, { useState, useEffect } from 'react';
import { ProjectDetails, SchedulerConfig, ProjectDetailProps } from '../types/project';
import { Slider } from '@mui/material';
import { Switch } from '@mui/material';
import { styled } from '@mui/material/styles';
import { saveProjectDetails, saveSchedulerConfig, getProjectDetails, getSchedulerConfig, getSendHistory } from '../utils/db';

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
      } catch (err) {
        setError('Failed to load project data');
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

  const handleEnableToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setSchedulerConfig(prev => ({ ...prev, is_enabled: newValue }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await Promise.all([
        saveProjectDetails(projectDetails, projectId),
        saveSchedulerConfig(schedulerConfig)
      ]);
      onClose();
    } catch (error) {
      setError('Failed to save changes');
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

  return (
    <Container>
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
          <Label>Enable</Label>
          <Switch
            checked={!!schedulerConfig.is_enabled}
            onChange={handleEnableToggle}
            color="primary"
            inputProps={{ 'aria-label': 'Enable Scheduler' }}
          />
        </FormGroup>
        <FormGroup>
          <Label>Number of DMs</Label>
          <Slider
            value={schedulerConfig.dm_num}
            onChange={(_, value) => handleSchedulerConfigChange('dm_num', value)}
            min={1}
            max={15}
            marks
            valueLabelDisplay="auto"
          />
        </FormGroup>
        <FormGroup>
          <Label>Frequency</Label>
          <Select
            value={schedulerConfig.dm_frequency}
            onChange={(e) => handleSchedulerConfigChange('dm_frequency', e.target.value)}
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </Select>
        </FormGroup>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </Section>

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