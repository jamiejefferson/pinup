-- PinUp Database Schema for Supabase
-- Run this in the Supabase SQL Editor to set up your database

-- Comments table
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  version_id text not null,
  created_at timestamptz default now(),
  author_name text not null,
  author_type text not null check (author_type in ('client', 'admin')),
  text text not null,
  element_selector text not null,
  element_text text,
  click_x integer not null,
  click_y integer not null,
  viewport_width integer not null,
  viewport_height integer not null,
  device_type text not null check (device_type in ('mobile', 'tablet', 'desktop'))
);

-- Index for faster lookups by project and version
create index if not exists comments_project_version_idx
  on comments (project_id, version_id);

-- Enable Row Level Security (optional but recommended)
alter table comments enable row level security;

-- Allow all operations for now (adjust based on your security needs)
create policy "Allow all operations" on comments
  for all
  using (true)
  with check (true);
