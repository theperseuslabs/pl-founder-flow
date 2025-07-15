import { ProjectDetails, SchedulerConfig } from '../types/project';

export const saveProjectDetails = async (projectDetails: ProjectDetails, projectId: string) => {
  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectDetails),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save project details');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving project details:', error);
    throw error;
  }
};

export const saveSchedulerConfig = async (config: SchedulerConfig) => {
  try {
    const response = await fetch('/api/scheduler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save scheduler config');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving scheduler config:', error);
    throw error;
  }
};

export const getProjectDetails = async (projectId: string) => {
  try {
    const response = await fetch(`/api/projects/${projectId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch project details');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching project details:', error);
    throw error;
  }
};

export const getSchedulerConfig = async (projectId: string) => {
  try {
    const response = await fetch(`/api/scheduler?project_id=${projectId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch scheduler config');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching scheduler config:', error);
    throw error;
  }
};

export const getSendHistory = async (projectId: string) => {
  try {
    const response = await fetch(`/api/projects/${projectId}/send-history`);
    if (!response.ok) {
      throw new Error('Failed to fetch send history');
    }
    const data = await response.json();
    return data.history;
  } catch (error) {
    console.error('Error fetching send history:', error);
    throw error;
  }
};

export async function getProjects() {
  const response = await fetch('/api/projects');
  
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }

  const data = await response.json();
  return data.projects;
} 

export const createProject = async (projectDetails: ProjectDetails) => {
  try {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectDetails),
    });
    if (!response.ok) {
      throw new Error('Failed to create project');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}; 