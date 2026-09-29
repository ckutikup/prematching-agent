-- Run this in the Supabase SQL editor. Idempotent — safe to re-run.

create extension if not exists vector;

create table if not exists programs (
  slug               text primary key,
  name               text not null,
  host               text not null,
  subjects           jsonb not null,
  format             text not null,
  grade_levels       jsonb not null,
  duration_weeks     integer not null,
  cost_model         text not null,
  selectivity        text not null,
  application_window text,
  eligibility_note   text,
  url                text,
  description        text not null
);

alter table programs
  add column if not exists embedding vector(512);

create index if not exists programs_embedding_idx
  on programs using hnsw (embedding vector_cosine_ops);

create table if not exists students (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  grade_level           text not null,
  interests             jsonb not null,
  gpa                   numeric(3,2),
  location_flexibility  text not null,
  budget_note           text,
  goals                 text,
  created_at            timestamptz not null default now()
);

alter table students
  add column if not exists cost_preference text not null default 'no_preference',
  add column if not exists goal_tags       jsonb not null default '[]'::jsonb,
  add column if not exists prior_experience text;

create table if not exists saved_programs (
  student_id    uuid not null references students(id) on delete cascade,
  program_slug  text not null references programs(slug) on delete cascade,
  note          text,
  created_at    timestamptz not null default now(),
  primary key (student_id, program_slug)
);

create index if not exists saved_programs_student_idx
  on saved_programs(student_id);

-- Vector similarity search. Returns full program rows plus a cosine similarity
-- score in [0, 1]. Called from the API via supabase.rpc().
create or replace function match_programs_by_embedding(
  query_embedding vector(512),
  match_count int
)
returns table (
  slug text,
  name text,
  host text,
  subjects jsonb,
  format text,
  grade_levels jsonb,
  duration_weeks integer,
  cost_model text,
  selectivity text,
  application_window text,
  eligibility_note text,
  url text,
  description text,
  similarity float
)
language sql
stable
as $$
  select
    p.slug, p.name, p.host, p.subjects, p.format, p.grade_levels,
    p.duration_weeks, p.cost_model, p.selectivity, p.application_window,
    p.eligibility_note, p.url, p.description,
    1 - (p.embedding <=> query_embedding) as similarity
  from programs p
  where p.embedding is not null
  order by p.embedding <=> query_embedding
  limit match_count;
$$;
