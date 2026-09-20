-- Composite FK access path and server-maintained modification times.
create index work_orders_client_location_idx on public.work_orders(client_id, location_id);

create function app_private.touch_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger users_touch before update on public.users
  for each row execute function app_private.touch_updated_at();
create trigger clients_touch before update on public.clients
  for each row execute function app_private.touch_updated_at();
create trigger locations_touch before update on public.locations
  for each row execute function app_private.touch_updated_at();
create trigger machines_touch before update on public.machines
  for each row execute function app_private.touch_updated_at();
create trigger work_orders_touch before update on public.work_orders
  for each row execute function app_private.touch_updated_at();
create trigger visits_touch before update on public.visits
  for each row execute function app_private.touch_updated_at();
create trigger visit_machine_reports_touch before update on public.visit_machine_reports
  for each row execute function app_private.touch_updated_at();
