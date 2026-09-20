-- Cada visita debe conservar su propia fecha y franja, incluso si se reprograma el trabajo.
alter table public.visits
  alter column scheduled_date set not null,
  alter column time_slot set not null;
