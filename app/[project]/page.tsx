import { redirect, notFound } from 'next/navigation';
import { getProjectSession } from '@/lib/auth';
import { getProject, getLatestVersion } from '@/lib/projects';
import { ReviewInterface } from '@/components/review-interface';

interface ProjectPageProps {
  params: Promise<{ project: string }>;
  searchParams: Promise<{ version?: string }>;
}

export default async function ProjectPage({ params, searchParams }: ProjectPageProps) {
  const { project: projectId } = await params;
  const { version: versionId } = await searchParams;
  
  // Get project
  const project = await getProject(projectId);
  if (!project) {
    notFound();
  }

  // Get session
  const session = await getProjectSession(projectId);
  if (!session) {
    redirect(`/${projectId}/login`);
  }

  // Determine which version to show
  const currentVersion = versionId 
    ? project.versions.find(v => v.id === versionId) || getLatestVersion(project)
    : getLatestVersion(project);

  if (!currentVersion) {
    notFound();
  }

  return (
    <ReviewInterface
      project={project}
      currentVersion={currentVersion}
      session={session}
    />
  );
}
