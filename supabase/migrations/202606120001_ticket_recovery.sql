create extension if not exists pgcrypto;

create table if not exists public.ticket_recovery_otps (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null,
  event_id text not null,
  ticket_id text not null,
  ticket_source text not null check (ticket_source in ('supabase', 'firestore', 'receipt')),
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0 and attempts <= 5),
  used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ticket_recovery_otps_lookup_idx
  on public.ticket_recovery_otps (email_hash, event_id, used, created_at desc);

create index if not exists ticket_recovery_otps_expiry_idx
  on public.ticket_recovery_otps (expires_at);

create table if not exists public.ticket_recovery_logs (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null,
  event_id text not null,
  action text not null check (
    action in (
      'RECOVERY_REQUEST',
      'RECOVERY_OTP_SENT',
      'RECOVERY_VERIFY_SUCCESS',
      'RECOVERY_VERIFY_FAILED',
      'RECOVERY_DOWNLOAD',
      'RECOVERY_RESEND'
    )
  ),
  ip_hash text,
  user_agent_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ticket_recovery_logs_limit_idx
  on public.ticket_recovery_logs (email_hash, event_id, action, created_at desc);

create index if not exists ticket_recovery_logs_created_idx
  on public.ticket_recovery_logs (created_at desc);

alter table public.ticket_recovery_otps enable row level security;
alter table public.ticket_recovery_logs enable row level security;

-- These tables are accessed only with SUPABASE_SERVICE_ROLE_KEY from Route Handlers.
