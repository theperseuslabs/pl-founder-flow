import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { 
  TrashIcon, 
  LinkIcon,
  UserIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface Project {
  id: string;
  productname: string;
  url: string;
  reddit_connected?: boolean;
  reddit_username?: string;
}

export interface ProjectCardProps {
  project: Project;
  onDelete?: (projectId: string) => void;
  onConnectReddit?: (projectId: string) => void;
  onClick?: (projectId: string) => void;
  className?: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onDelete,
  onConnectReddit,
  onClick,
  className,
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(project.id);
    }
  };

  const handleConnectReddit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onConnectReddit) {
      onConnectReddit(project.id);
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(project.id);
    }
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md hover:-translate-y-1 cursor-pointer",
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="relative pb-2">
        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
        <CardTitle className="text-lg">{project.productname}</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <LinkIcon className="h-4 w-4" />
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hover:text-foreground transition-colors truncate"
          >
            {project.url}
          </a>
        </div>

        {project.reddit_username && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <UserIcon className="h-4 w-4" />
            <span>Sending as: u/{project.reddit_username}</span>
          </div>
        )}

        <Button
          variant={project.reddit_connected ? "success" : "reddit"}
          onClick={handleConnectReddit}
          className="w-full"
          leftIcon={project.reddit_connected ? undefined : <PlusIcon className="h-4 w-4" />}
        >
          {project.reddit_connected ? 'Reconnect Reddit Account' : 'Connect Reddit Account'}
        </Button>
      </CardContent>
    </Card>
  );
}; 