'use client';
import ProjectDetail from '@/components/ProjectDetail';

export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <div style={{ padding: '32px 0' }}>
      <ProjectDetail projectId={params.id} onClose={() => {}} />
    </div>
  );
} 