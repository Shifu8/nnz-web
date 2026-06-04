create extension if not exists pgcrypto;

create table if not exists public.tickets (
  id uuid primary key,
  first_name text not null,
  last_name text not null,
  phone_hash text not null,
  phone_encrypted text not null,
  email_hash text not null,
  email_encrypted text not null,
  document_hash text not null,
  document_encrypted text not null,
  event_id text not null,
  amount numeric(10,2) not null,
  status text not null check (status in ('pending', 'approved', 'declined', 'cancelled')),
  processor text not null default 'payphone',
  payment_token_hash text,
  processor_ticket_number text,
  processor_response jsonb,
  decline_reason text,
  serial_number text,
  qr_payload_encrypted text,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz
);

create table if not exists public.access_drops (
  id uuid primary key,
  first_name text not null,
  last_name text not null,
  phone_hash text not null,
  phone_encrypted text not null,
  email_hash text,
  email_encrypted text,
  document_hash text,
  document_encrypted text,
  event_id text not null,
  serial_number text not null unique,
  status text not null check (status in ('confirmed', 'cancelled')),
  registered_at timestamptz not null default now()
);

create table if not exists public.party_passes (
  serial_number text primary key,
  code_hash text not null,
  event_id text not null,
  participant_id uuid not null references public.access_drops(id) on delete cascade,
  used boolean not null default false,
  expires_at timestamptz not null,
  qr_payload_encrypted text not null,
  type text not null default 'FOUNDING_DAWG',
  created_at timestamptz not null default now(),
  scanned_at timestamptz,
  scanned_by text,
  scan_ip_hash text,
  scan_user_agent_hash text
);

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor_hash text,
  ip_hash text,
  user_agent_hash text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists access_drops_phone_event_active_idx
  on public.access_drops (phone_hash, event_id)
  where status = 'confirmed';

create unique index if not exists tickets_processor_ticket_idx
  on public.tickets (processor, processor_ticket_number)
  where processor_ticket_number is not null;

create index if not exists party_passes_unused_lookup_idx
  on public.party_passes (serial_number, event_id, code_hash, used, expires_at);

alter table public.tickets enable row level security;
alter table public.access_drops enable row level security;
alter table public.party_passes enable row level security;
alter table public.security_events enable row level security;

create table if not exists public.ticket_resends (
  id uuid primary key default gen_random_uuid(),
  serial_number text not null,
  channel text not null check (channel in ('email', 'phone', 'both')),
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now()
);

create index if not exists ticket_resends_serial_created_idx
  on public.ticket_resends (serial_number, created_at desc);

alter table public.ticket_resends enable row level security;

-- Giveaway (registro en vivo, 7:30 PM Ecuador)
create table if not exists public.giveaway_entries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  first_name text not null,
  last_name text not null,
  email text,
  email_hash text,
  phone text not null,
  phone_hash text not null,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now()
);

create unique index if not exists giveaway_entries_phone_unique_idx
  on public.giveaway_entries (phone_hash);

create unique index if not exists giveaway_entries_email_unique_idx
  on public.giveaway_entries (email_hash)
  where email_hash is not null;

create index if not exists giveaway_entries_created_idx
  on public.giveaway_entries (created_at desc);

alter table public.giveaway_entries enable row level security;

-- Events (admin CRUD)
create table if not exists public.events (
  id uuid primary key,
  title text not null,
  subtitle text default '',
  location text default '',
  date text not null,
  time text not null,
  countdown_date text default '',
  price numeric(10,2) not null default 0,
  image_url text default '',
  description text default '',
  status text not null default 'active' check (status in ('active', 'inactive')),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events enable row level security;

-- Logs de acciones admin/staff
create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_logs_created_idx
  on public.admin_logs (created_at desc);

alter table public.admin_logs enable row level security;

-- The app uses SUPABASE_SERVICE_ROLE_KEY on the server only. Do not expose it to the browser.
