'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/firebase/AuthContext';
import { setCookie } from 'cookies-next';
import './dashboard.css';
import ProjectDetail from '@/components/ProjectDetail';
import { useRouter } from 'next/navigation';
import { createProject } from '@/utils/db';
import { useRef } from 'react';
import { RedditDMSection } from '@/components/RedditDMSection';

interface Project {
  id: string;
  productname: string;
  url: string;
  reddit_connected?: boolean;
  reddit_username?: string; // Add reddit_username to Project
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

    const scope = "identity privatemessages".replace(" ", ",");
    const authUrl = `https://www.reddit.com/api/v1/authorize?client_id=${clientId}&response_type=code&state=${randomState}&redirect_uri=${encodeURIComponent(redirectUri)}&duration=permanent&scope=${encodeURIComponent(scope)}`;
    
    window.location.href = authUrl;
  };

  const handleRedditDMCreate = async (fields: any, results: any) => {
    setCreating(true);
    setCreateError(null);
    try {
      await createProject({
        userid: auth?.user?.uid,
        productname: fields.productName,
        url: fields.productUrl,
        elevatorpitch: fields.elevatorpitch,
        purpose: fields.purpose,
        subject: results[results.length-1]?.output?.subject || '',
        message_copy: results[results.length-1]?.output?.body || '',
      });
      setShowAddModal(false);
      setNewProject({
        productname: '',
        url: '',
        elevatorpitch: '',
        purpose: '',
        subject: '',
        message_copy: '',
      });
      // Refresh project list
      setLoading(true);
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data.projects);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  if (!auth) {
    return (
      <div className="loading-spinner">
        <div></div>
      </div>
    );
  }

  if (!auth.user) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-content">
          <div className="dashboard-card">
            <div className="section-header">
              <h2 className="section-title">Welcome to Reddit DM Scheduler</h2>
              <p className="text-gray-600">Sign in to get started</p>
            </div>
            <button
              onClick={() => auth.signInWithGoogle()}
              className="reddit-connect-button"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-card">
          <div className="section-header">
            <h2 className="section-title">Your Projects</h2>
            <button
              className="reddit-connect-button"
              style={{ marginLeft: 'auto' }}
              onClick={() => setShowAddModal(true)}
            >
              + Add a project
            </button>
          </div>
          {showAddModal && (
            <div className="ff-modal-overlay" onClick={() => setShowAddModal(false)}>
              <div className="ff-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                <div className="ff-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2>Add a Project</h2>
                  <button className="ff-modal-close" onClick={() => setShowAddModal(false)}>&times;</button>
                </div>
                {createError && <div style={{ color: 'red', marginBottom: 8 }}>{createError}</div>}
                <RedditDMSection
                  initialFields={{}}
                  mode="create"
                  // onSubmit={handleRedditDMCreate}
                  showResults={false}
                />
              </div>
            </div>
          )}
          {loading ? (
            <div className="loading-spinner">
              <div></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <p>No projects found. Create your first project to get started.</p>
            </div>
          ) : (
            <div className="project-grid">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="project-card"
                  onClick={() => router.push(`/project/${project.id}`)}
                >
                  <h3>{project.productname}</h3>
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {project.url}
                  </a>
                  {/* Show Reddit username if available */}
                  {project.reddit_username && (
                    <div style={{ margin: '8px 0', color: 'gray', fontWeight: 500 }}>
                      Sending as: u/{project.reddit_username}
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConnectToReddit(project.id);
                    }}
                    className={`reddit-connect-button ${project.reddit_connected ? 'connected' : ''}`}
                  >
                    {project.reddit_connected ? 'Reconnect Reddit Account' : 'Connect Reddit Account'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 