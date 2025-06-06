'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/firebase/AuthContext';
import { setCookie } from 'cookies-next';
import './dashboard.css';
import ProjectDetail from '@/components/ProjectDetail';

interface Project {
  id: string;
  productname: string;
  url: string;
  reddit_connected?: boolean;
}

export default function Dashboard() {
  const auth = useAuth();
  const [isRedditConnected, setIsRedditConnected] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data = await response.json();
        setProjects(data.projects);
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
            <h1 className="section-title">Dashboard</h1>
            <div className="user-info">
              <span>Signed in as {auth.user.email}</span>
            </div>
          </div>
        </div>

        {selectedProjectId ? (
          <div className="dashboard-card">
            <ProjectDetail 
              projectId={selectedProjectId} 
              onClose={() => setSelectedProjectId(null)} 
            />
          </div>
        ) : (
          <div className="dashboard-card">
            <h2 className="section-title">Your Projects</h2>
            
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
                    onClick={() => setSelectedProjectId(project.id)}
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
        )}
      </div>
    </div>
  );
} 