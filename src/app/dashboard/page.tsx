'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/firebase/AuthContext';
import { useRouter } from 'next/navigation';
import { Project } from '@/types/project';
import { getProjects } from '@/utils/db';
import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';

const Container = styled('div')({
  padding: '24px',
  maxWidth: '1200px',
  margin: '0 auto',
});

const ProjectGrid = styled('div')({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '24px',
  marginTop: '24px',
});

const ProjectCard = styled('div')({
  backgroundColor: '#fff',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  cursor: 'pointer',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
});

const ProjectTitle = styled('h3')({
  margin: '0 0 12px 0',
  color: '#333',
});

const ProjectDescription = styled('p')({
  margin: '0 0 16px 0',
  color: '#666',
  fontSize: '14px',
});

const ProjectUrl = styled('a')({
  color: '#007bff',
  textDecoration: 'none',
  fontSize: '14px',
  '&:hover': {
    textDecoration: 'underline',
  },
});

const LoadingSpinner = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '200px',
  '& > div': {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
});

const EmptyState = styled('div')({
  textAlign: 'center',
  padding: '48px',
  backgroundColor: '#fff',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
});

const SectionHeader = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
  '& h1': {
    fontSize: '24px',
    fontWeight: '600',
    color: '#333',
    margin: 0,
  },
});

const UserInfo = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

const UserAvatar = styled('div')({
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: '#007bff',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '18px',
  fontWeight: 'bold',
});

export default function Dashboard() {
  const router = useRouter();
  const auth = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await getProjects();
        setProjects(data);
      } catch (err) {
        setError('Failed to load projects');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (auth?.user) {
      fetchProjects();
    }
  }, [auth?.user]);

  const handleProjectClick = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}`);
  };

  if (!auth?.user) {
    return (
      <Container>
        <div>Please sign in to view your dashboard.</div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>
          <div></div>
        </LoadingSpinner>
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
      <SectionHeader>
        <h1>My Projects</h1>
        <UserInfo>
          <UserAvatar>
            {auth.user.email?.[0].toUpperCase()}
          </UserAvatar>
          <span>{auth.user.email}</span>
        </UserInfo>
      </SectionHeader>

      {projects.length === 0 ? (
        <EmptyState>
          <h2>No projects yet</h2>
          <p>Create your first project to get started</p>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push('/dashboard/projects/new')}
            sx={{ mt: 2 }}
          >
            Create Project
          </Button>
        </EmptyState>
      ) : (
        <ProjectGrid>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              onClick={() => handleProjectClick(project.id)}
            >
              <ProjectTitle>{project.productname}</ProjectTitle>
              <ProjectDescription>{project.elevatorpitch}</ProjectDescription>
              {project.url && (
                <ProjectUrl
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {project.url}
                </ProjectUrl>
              )}
            </ProjectCard>
          ))}
        </ProjectGrid>
      )}
    </Container>
  );
} 