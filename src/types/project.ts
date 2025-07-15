export interface ProjectDetails {
  userid?: string;
  productname: string;
  url: string;
  elevatorpitch: string;
  purpose: string;
  subject: string;
  message_copy: string;
}

export interface SchedulerConfig {
  userid: string;
  id?: string;
  project_id: string;
  dm_num: number;
  dm_frequency: 'hourly' | 'daily' | 'weekly';
  is_enabled?: boolean;
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
  subject: string;
  message_copy: string;
  reddit_connected?: boolean;
} 