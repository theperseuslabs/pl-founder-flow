'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/firebase/AuthContext';
import { setCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import { createProject } from '@/utils/db';
import { useRef } from 'react';
import { RedditDMSection } from '@/components/RedditDMSection';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Modal,
  ProjectCard,
  Footer
} from '@/components/ui';

interface Project {
  id: string;
  productname: string;
  url: string;
  reddit_connected?: boolean;
  reddit_username?: string;
}

export default function Dashboard() {
  const auth = useAuth();
  const router = useRouter();
  const [isRedditConnected, setIsRedditConnected] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({
    productname: '',
    url: '',
    elevatorpitch: '',
    purpose: '',
    subject: '',
    message_copy: '',
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data = await response.json();
        // For each project, fetch reddit_username
        const projectsWithUsernames = await Promise.all(
          data.projects.map(async (project: Project) => {
            try {
              const res = await fetch(`/api/projects/reddit-auth?project_id=${project.id}`);
              if (res.ok) {
                const { reddit_username } = await res.json();
                return { ...project, reddit_username };
              }
            } catch (e) {}
            return { ...project, reddit_username: undefined };
          })
        );
        setProjects(projectsWithUsernames);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    if (auth?.user) {
      fetchProjects();
    }
  }, [auth?.user]);

  const handleConnectToReddit = (projectId: string) => {
    const clientId = process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      alert("Reddit API client ID or redirect URI is not configured. Please check environment variables.");
      return;
    }

    const randomState = Math.random().toString(36).substring(2, 15);
    setCookie('reddit_oauth_state', randomState, {
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    // Store the project ID in a cookie to handle the redirect
    setCookie('project_id', projectId, {
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    const scope = "identity privatemessages submit".replace(" ", ",");
    const authUrl = `https://www.reddit.com/api/v1/authorize?client_id=${clientId}&response_type=code&state=${randomState}&redirect_uri=${encodeURIComponent(redirectUri)}&duration=permanent&scope=${encodeURIComponent(scope)}`;
    
    window.location.href = authUrl;
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
        if (res.ok) {
          setProjects((prev) => prev.filter((p) => p.id !== projectId));
        } else {
          alert('Failed to delete project');
        }
      } catch (err) {
        alert('Failed to delete project');
      }
    }
  };

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!auth.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 p-4">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Welcome to Reddit DM Scheduler</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Sign in to get started</p>
                <Button onClick={() => auth.signInWithGoogle()}>
                  Sign in with Google
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Your Projects</CardTitle>
                <Button onClick={() => setShowAddModal(true)}>
                  + Add a project
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddModal && (
                <Modal
                  isOpen={showAddModal}
                  onClose={() => setShowAddModal(false)}
                  title="Add a Project"
                  size="lg"
                >
                  {createError && (
                    <div className="text-destructive mb-4">{createError}</div>
                  )}
                  <RedditDMSection
                    initialFields={{}}
                    mode="create"
                    showResults={false}
                  />
                </Modal>
              )}
              
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <p>No projects found. Create your first project to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onDelete={handleDeleteProject}
                      onConnectReddit={handleConnectToReddit}
                      onClick={(projectId) => router.push(`/project/${projectId}`)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
} 