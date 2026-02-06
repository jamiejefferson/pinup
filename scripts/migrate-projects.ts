/**
 * Migration script to move projects from JSON file to Supabase
 * 
 * Run with: npx tsx scripts/migrate-projects.ts
 * 
 * Prerequisites:
 * 1. Run the SQL migration (supabase/migrations/001_multi_tenancy.sql)
 * 2. Set environment variables for Supabase
 * 3. Create a super admin first (via environment variables or manually)
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface ProjectVersion {
  id: string;
  label: string;
  url: string;
}

interface Project {
  id: string;
  name: string;
  clientPassword: string;
  versions: ProjectVersion[];
}

async function migrate() {
  console.log('Starting project migration...\n');

  // Read existing projects.json
  const projectsPath = path.join(process.cwd(), 'data', 'projects.json');
  
  if (!fs.existsSync(projectsPath)) {
    console.log('No projects.json found. Nothing to migrate.');
    return;
  }

  const projectsData = JSON.parse(fs.readFileSync(projectsPath, 'utf-8'));
  const projects: Project[] = Object.values(projectsData);

  console.log(`Found ${projects.length} projects to migrate.\n`);

  // Get or create a super admin to be the owner
  let ownerId: string | null = null;

  // Check for existing super admin
  const { data: existingAdmins } = await supabase
    .from('admins')
    .select('id')
    .eq('is_super_admin', true)
    .limit(1);

  if (existingAdmins && existingAdmins.length > 0) {
    ownerId = existingAdmins[0].id;
    console.log(`Using existing super admin as owner: ${ownerId}\n`);
  } else {
    // Create a default super admin
    const email = process.env.PINUP_SUPER_ADMIN_EMAIL || 'admin@pinup.local';
    const password = process.env.PINUP_SUPER_ADMIN_PASSWORD || 'changeme123';
    
    // Import bcrypt dynamically for the script
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const { data: newAdmin, error: adminError } = await supabase
      .from('admins')
      .insert({
        email,
        password_hash: passwordHash,
        name: 'Super Admin',
        is_super_admin: true,
      })
      .select()
      .single();

    if (adminError) {
      console.error('Failed to create super admin:', adminError);
      process.exit(1);
    }

    ownerId = newAdmin.id;
    console.log(`Created super admin: ${email}`);
    console.log(`Super admin ID: ${ownerId}\n`);
  }

  // Migrate each project
  for (const project of projects) {
    console.log(`Migrating project: ${project.name} (${project.id})`);

    // Check if project already exists
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project.id)
      .single();

    if (existing) {
      console.log(`  - Project already exists, skipping.\n`);
      continue;
    }

    // Insert project
    const { error: projectError } = await supabase.from('projects').insert({
      id: project.id,
      name: project.name,
      client_password: project.clientPassword,
      owner_id: ownerId,
    });

    if (projectError) {
      console.error(`  - Failed to insert project: ${projectError.message}`);
      continue;
    }

    console.log(`  - Project created.`);

    // Insert versions
    for (const version of project.versions) {
      const { error: versionError } = await supabase
        .from('project_versions')
        .insert({
          id: version.id,
          project_id: project.id,
          label: version.label,
          url: version.url,
        });

      if (versionError) {
        console.error(`  - Failed to insert version ${version.id}: ${versionError.message}`);
      } else {
        console.log(`  - Version ${version.id} created.`);
      }
    }

    console.log('');
  }

  console.log('Migration complete!');
  console.log('\nNext steps:');
  console.log('1. Verify the data in Supabase dashboard');
  console.log('2. Update your app to use the new database-backed projects');
  console.log('3. Optionally backup and remove data/projects.json');
}

migrate().catch(console.error);
