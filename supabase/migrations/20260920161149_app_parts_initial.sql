-- App de Partes. Acceso a datos exclusivamente desde el servidor de la app.
-- Las contraseñas y sesiones actuales se conservan en tablas propias.

create table public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  display_name text not null,
  role text not null check (role in ('OFFICE', 'TECHNICIAN')),
  password_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_username_format check (username ~ '^[a-z0-9._-]{3,30}$')
);

create table public.sessions (
  id text primary key,
  user_id uuid not null references public.users(id) on delete restrict,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index sessions_user_id_idx on public.sessions(user_id);
create index sessions_expires_at_idx on public.sessions(expires_at);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text not null default '',
  phone text not null default '',
  email text not null default '',
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index clients_name_idx on public.clients(name);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  name text not null,
  address text not null,
  contact_name text not null default '',
  phone text not null default '',
  access_notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, id)
);
create index locations_client_id_idx on public.locations(client_id);

create table public.machines (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete restrict,
  code text not null,
  type text not null,
  brand text not null default '',
  model text not null default '',
  serial_number text not null default '',
  internal_location text not null default '',
  installation_date date,
  photo_object_key text,
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (location_id, code)
);
create index machines_serial_number_idx on public.machines(serial_number) where serial_number <> '';

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  client_id uuid not null references public.clients(id) on delete restrict,
  location_id uuid not null references public.locations(id) on delete restrict,
  type text not null check (type in ('INSTALLATION', 'MAINTENANCE', 'BREAKDOWN')),
  reported_issue text not null,
  -- Current appointment cache for the existing agenda. Historical values live on visits.
  scheduled_date date,
  time_slot text check (time_slot in ('MORNING', 'AFTERNOON')),
  assigned_technician_id uuid references public.users(id) on delete restrict,
  status text not null default 'REGISTERED' check (status in ('REGISTERED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_PART', 'PENDING_RETURN', 'COMPLETED')),
  office_notes text not null default '',
  reopened_reason text,
  created_by_id uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (client_id, location_id) references public.locations(client_id, id) on delete restrict
);
create index work_orders_technician_status_idx on public.work_orders(assigned_technician_id, status);
create index work_orders_date_status_idx on public.work_orders(scheduled_date, status);
create index work_orders_client_created_idx on public.work_orders(client_id, created_at);
create index work_orders_location_id_idx on public.work_orders(location_id);
create index work_orders_created_by_id_idx on public.work_orders(created_by_id);

create table public.work_order_counters (
  year integer primary key check (year between 2000 and 9999),
  last_value integer not null check (last_value > 0),
  updated_at timestamptz not null default now()
);

create schema if not exists app_private;
create function app_private.next_work_order_number()
returns text language plpgsql security invoker set search_path = '' as $$
declare
  order_year integer := extract(year from now() at time zone 'America/Lima')::integer;
  order_sequence integer;
begin
  insert into public.work_order_counters(year, last_value)
  values (order_year, 1)
  on conflict (year) do update
    set last_value = public.work_order_counters.last_value + 1, updated_at = now()
  returning last_value into order_sequence;
  return 'OT-' || order_year || '-' || lpad(order_sequence::text, greatest(4, length(order_sequence::text)), '0');
end;
$$;
revoke all on schema app_private from public, anon, authenticated;
revoke all on function app_private.next_work_order_number() from public, anon, authenticated;

create table public.work_order_machines (
  work_order_id uuid not null references public.work_orders(id) on delete restrict,
  machine_id uuid not null references public.machines(id) on delete restrict,
  primary key (work_order_id, machine_id)
);
create index work_order_machines_machine_id_idx on public.work_order_machines(machine_id);

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete restrict,
  sequence integer not null check (sequence > 0),
  technician_id uuid not null references public.users(id) on delete restrict,
  scheduled_date date,
  time_slot text check (time_slot in ('MORNING', 'AFTERNOON')),
  started_at timestamptz,
  ended_at timestamptz,
  outcome text not null default 'SCHEDULED' check (outcome in ('SCHEDULED', 'DRAFT', 'PENDING_PART', 'PENDING_RETURN', 'COMPLETED')),
  general_notes text not null default '',
  signer_name text,
  signature_object_key text,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (work_order_id, sequence),
  constraint visits_signed_fields check (
    (signed_at is null and outcome in ('SCHEDULED', 'DRAFT')) or
    (signed_at is not null and outcome in ('PENDING_PART', 'PENDING_RETURN', 'COMPLETED') and
     started_at is not null and ended_at is not null and signer_name is not null and
     signature_object_key is not null)
  ),
  constraint visits_scheduled_fields check (outcome <> 'SCHEDULED' or (scheduled_date is not null and time_slot is not null))
);
create index visits_work_order_id_idx on public.visits(work_order_id);
create index visits_technician_date_idx on public.visits(technician_id, scheduled_date);
create index visits_date_slot_idx on public.visits(scheduled_date, time_slot);
create unique index visits_one_open_per_order_idx on public.visits(work_order_id) where outcome in ('SCHEDULED', 'DRAFT');

create table public.machine_proposals (
  id uuid primary key default gen_random_uuid(),
  proposal_type text not null check (proposal_type in ('CREATE', 'UPDATE')),
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  location_id uuid not null references public.locations(id) on delete restrict,
  work_order_id uuid not null references public.work_orders(id) on delete restrict,
  existing_machine_id uuid references public.machines(id) on delete restrict,
  approved_machine_id uuid references public.machines(id) on delete restrict,
  proposed_code text not null,
  proposed_type text not null,
  proposed_brand text not null default '',
  proposed_model text not null default '',
  proposed_serial_number text not null default '',
  proposed_internal_location text not null default '',
  proposed_installation_date date,
  proposed_notes text not null default '',
  proposed_photo_object_key text,
  proposed_by_id uuid not null references public.users(id) on delete restrict,
  reviewed_by_id uuid references public.users(id) on delete restrict,
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint machine_proposals_existing_target check (
    (proposal_type = 'CREATE' and existing_machine_id is null) or
    (proposal_type = 'UPDATE' and existing_machine_id is not null)
  ),
  constraint machine_proposals_approval_target check (status <> 'APPROVED' or approved_machine_id is not null)
);
create index machine_proposals_pending_idx on public.machine_proposals(created_at) where status = 'PENDING';
create index machine_proposals_order_id_idx on public.machine_proposals(work_order_id);
create index machine_proposals_location_id_idx on public.machine_proposals(location_id);
create index machine_proposals_existing_machine_id_idx on public.machine_proposals(existing_machine_id);
create index machine_proposals_approved_machine_id_idx on public.machine_proposals(approved_machine_id);
create index machine_proposals_proposed_by_id_idx on public.machine_proposals(proposed_by_id);
create index machine_proposals_reviewed_by_id_idx on public.machine_proposals(reviewed_by_id);

create table public.visit_machine_reports (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete restrict,
  machine_id uuid references public.machines(id) on delete restrict,
  proposal_id uuid references public.machine_proposals(id) on delete restrict,
  machine_label_snapshot text,
  problem_found text not null default '',
  work_performed text not null default '',
  actions_taken text not null default '',
  parts_replaced text not null default '',
  observations text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visit_reports_target check ((machine_id is null) <> (proposal_id is null))
);
create index visit_machine_reports_visit_id_idx on public.visit_machine_reports(visit_id);
create index visit_machine_reports_machine_visit_idx on public.visit_machine_reports(machine_id, visit_id);
create index visit_machine_reports_proposal_id_idx on public.visit_machine_reports(proposal_id);
create unique index visit_machine_reports_visit_machine_unique_idx on public.visit_machine_reports(visit_id, machine_id) where machine_id is not null;
create unique index visit_machine_reports_visit_proposal_unique_idx on public.visit_machine_reports(visit_id, proposal_id) where proposal_id is not null;

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.visit_machine_reports(id) on delete restrict,
  object_key text not null unique,
  file_name text not null,
  content_type text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp')),
  size bigint not null check (size > 0 and size <= 8388608),
  created_at timestamptz not null default now()
);
create index photos_report_id_idx on public.photos(report_id);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete restrict,
  version integer not null default 1 check (version > 0),
  object_key text not null unique,
  file_name text not null,
  content_type text not null default 'application/pdf' check (content_type = 'application/pdf'),
  size bigint not null check (size > 0),
  sha256 text,
  created_at timestamptz not null default now(),
  unique (visit_id, version)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.users(id) on delete restrict,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_actor_id_idx on public.audit_logs(actor_id);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at);
create index audit_logs_created_at_idx on public.audit_logs(created_at);

create function app_private.prevent_immutable_change()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  raise exception 'El registro firmado o auditado no puede modificarse ni eliminarse';
end;
$$;

create function app_private.prevent_signed_visit_change()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if old.signed_at is not null then
    raise exception 'La visita firmada no puede modificarse ni eliminarse';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create function app_private.prevent_signed_report_change()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if exists (select 1 from public.visits where id = old.visit_id and signed_at is not null) then
    raise exception 'El informe de una visita firmada no puede modificarse ni eliminarse';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create function app_private.prevent_signed_photo_change()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if exists (
    select 1 from public.visits v
    join public.visit_machine_reports r on r.visit_id = v.id
    where r.id = old.report_id and v.signed_at is not null
  ) then
    raise exception 'La foto de una visita firmada no puede modificarse ni eliminarse';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger visits_signed_guard before update or delete on public.visits
  for each row execute function app_private.prevent_signed_visit_change();
create trigger reports_signed_guard before update or delete on public.visit_machine_reports
  for each row execute function app_private.prevent_signed_report_change();
create trigger photos_signed_guard before update or delete on public.photos
  for each row execute function app_private.prevent_signed_photo_change();
create trigger documents_immutable_guard before update or delete on public.documents
  for each row execute function app_private.prevent_immutable_change();
create trigger audit_immutable_guard before update or delete on public.audit_logs
  for each row execute function app_private.prevent_immutable_change();

create function app_private.validate_work_order_machine()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (
    select 1 from public.work_orders w
    join public.machines m on m.location_id = w.location_id
    where w.id = new.work_order_id and m.id = new.machine_id
  ) then
    raise exception 'La máquina no pertenece al local del trabajo';
  end if;
  return new;
end;
$$;
create trigger work_order_machine_location_guard before insert or update on public.work_order_machines
  for each row execute function app_private.validate_work_order_machine();

create function app_private.validate_report_target()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.machine_id is not null and not exists (
    select 1 from public.visits v
    join public.work_orders w on w.id = v.work_order_id
    join public.machines m on m.location_id = w.location_id
    where v.id = new.visit_id and m.id = new.machine_id
  ) then
    raise exception 'La máquina del informe no pertenece al local de la visita';
  end if;
  if new.proposal_id is not null and not exists (
    select 1 from public.visits v
    join public.machine_proposals p on p.work_order_id = v.work_order_id
    where v.id = new.visit_id and p.id = new.proposal_id
  ) then
    raise exception 'La propuesta del informe no pertenece al trabajo de la visita';
  end if;
  return new;
end;
$$;
create trigger visit_report_target_guard before insert or update on public.visit_machine_reports
  for each row execute function app_private.validate_report_target();

-- Custom sessions are checked by the app server. Data API has no public grants.
alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.clients enable row level security;
alter table public.locations enable row level security;
alter table public.machines enable row level security;
alter table public.work_orders enable row level security;
alter table public.work_order_counters enable row level security;
alter table public.work_order_machines enable row level security;
alter table public.visits enable row level security;
alter table public.machine_proposals enable row level security;
alter table public.visit_machine_reports enable row level security;
alter table public.photos enable row level security;
alter table public.documents enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.users, public.sessions, public.clients, public.locations,
  public.machines, public.work_orders, public.work_order_counters,
  public.work_order_machines, public.visits, public.machine_proposals,
  public.visit_machine_reports, public.photos, public.documents,
  public.audit_logs from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('partes-imagenes', 'partes-imagenes', false, 8388608, array['image/jpeg','image/png','image/webp']),
  ('partes-documentos', 'partes-documentos', false, 15728640, array['application/pdf'])
on conflict (id) do nothing;
