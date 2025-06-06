'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/firebase/AuthContext';
import { useRouter } from 'next/navigation';
import { ProjectDetails, SchedulerConfig } from '@/types/project';
import { Slider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { saveProjectDetails, saveSchedulerConfig, getProjectDetails, getSchedulerConfig } from '@/utils/db';

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
    response: '',
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
      } catch (err) {
        setError('Failed to load project data');
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
      router.push('/dashboard');
    } catch (error) {
      setError('Failed to save changes');
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

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
      <BackButton onClick={() => router.push('/dashboard')}>
        ← Back to Dashboard
      </BackButton>

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
          <Label>Response</Label>
          <TextArea
            value={projectDetails.response}
            onChange={(e) => handleProjectDetailsChange('response', e.target.value)}
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
      </Section>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </Container>
  );
} 