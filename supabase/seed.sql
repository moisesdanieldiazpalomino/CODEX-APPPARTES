-- Datos de prueba adicionales. No reemplaza ningún dato migrado.
do $$
declare
  office_id uuid;
  technician_id uuid;
  client_id uuid := gen_random_uuid();
  location_id uuid := gen_random_uuid();
  first_machine_id uuid := gen_random_uuid();
  second_machine_id uuid := gen_random_uuid();
  order_id uuid := gen_random_uuid();
  order_number text;
begin
  if exists (select 1 from public.clients where name = 'DEMO - Centro Empresarial Andino') then
    return;
  end if;

  select id into office_id from public.users where role = 'OFFICE' and active order by created_at limit 1;
  select id into technician_id from public.users where username = 'tecnico3' and active;
  if office_id is null or technician_id is null then
    raise exception 'Faltan la cuenta de oficina o el técnico de prueba';
  end if;

  insert into public.clients(id, name, contact_name, phone, email, notes)
  values (client_id, 'DEMO - Centro Empresarial Andino', 'Contacto de prueba', '000 000 000', 'demo-centro@example.test', 'Datos ficticios para validar la migración.');
  insert into public.locations(id, client_id, name, address, access_notes)
  values (location_id, client_id, 'Torre A', 'Dirección de prueba, Lima', 'Solicitar acceso a recepción.');
  insert into public.machines(id, location_id, code, type, brand, model, internal_location)
  values
    (first_machine_id, location_id, 'DEMO-SPLIT-01', 'Split pared', 'Marca de prueba', 'Modelo A', 'Oficina 301'),
    (second_machine_id, location_id, 'DEMO-SPLIT-02', 'Split pared', 'Marca de prueba', 'Modelo B', 'Oficina 302');

  select app_private.next_work_order_number() into order_number;
  insert into public.work_orders(
    id, number, client_id, location_id, type, reported_issue,
    scheduled_date, time_slot, assigned_technician_id, status, created_by_id
  ) values (
    order_id, order_number, client_id, location_id, 'MAINTENANCE',
    'DEMO: revisar filtros y rendimiento de dos equipos.',
    (now() at time zone 'America/Lima')::date + 1, 'AFTERNOON', technician_id, 'ASSIGNED', office_id
  );
  insert into public.work_order_machines(work_order_id, machine_id)
  values (order_id, first_machine_id), (order_id, second_machine_id);
  insert into public.audit_logs(id, actor_id, entity_type, entity_id, action, details)
  values (gen_random_uuid(), office_id, 'WORK_ORDER', order_id, 'DEMO_CREATED', '{"source":"supabase/seed.sql"}'::jsonb);
end;
$$;
