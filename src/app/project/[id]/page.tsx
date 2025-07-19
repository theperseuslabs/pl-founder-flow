'use client';
import ProjectDetail from '@/components/ProjectDetail';

export default function ProjectPage({ params }: { params: { id: string } }) {
  return <ProjectDetail projectId={params.id} onClose={() => {}} />;
} 