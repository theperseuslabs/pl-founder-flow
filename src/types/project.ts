export interface ProjectDetails {
  productname: string;
  url: string;
  elevatorpitch: string;
  purpose: string;
  response: string;
}

export interface SchedulerConfig {
  userid: string;
  id?: string;
  project_id: string;
  dm_num: number;
  dm_frequency: 'hourly' | 'daily' | 'weekly';
}

export interface ProjectDetailProps {
  projectId: string;
  onClose: () => void;
}

export interface Project {
  id: string;
  productname: string;
  url: string;
  elevatorpitch: string;
  purpose: string;
  response: string;
  reddit_connected?: boolean;
} 