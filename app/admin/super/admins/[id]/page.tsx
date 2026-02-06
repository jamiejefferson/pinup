import { redirect, notFound } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { getAdmin } from '@/lib/admins';
import { getProjectsByOwner } from '@/lib/projects-db';
import { AdminEditClient } from './admin-edit-client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface AdminEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditPage({ params }: AdminEditPageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  if (!session.isSuperAdmin) {
    redirect('/admin/dashboard');
  }

  const { id: adminId } = await params;
  const admin = await getAdmin(adminId);

  if (!admin) {
    notFound();
  }

  // Get this admin's projects
  const projects = await getProjectsByOwner(adminId);

  return <AdminEditClient admin={admin} projects={projects} currentAdminId={session.adminId} />;
}
