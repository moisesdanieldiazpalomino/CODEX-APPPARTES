# Propuesta 003: modelo de datos en Supabase

**Estado:** propuesta histórica, reemplazada en los puntos de autenticación y programación por [004 — Supabase con acceso por nombre de usuario](004-supabase-username-migration.md). **Fecha:** 20 de septiembre de 2026. Véase la migración efectiva en `supabase/migrations/`.

## Alcance y criterio

Se propone Supabase alojado para PostgreSQL, Auth y Storage; la aplicación podrá ejecutarse después en un VPS. Es una sola empresa, por lo que no hace falta `tenant_id`. Se conservan clientes, locales, máquinas, trabajos con varias visitas, partes por máquina, propuestas, fotos, PDF y auditoría. No se agregan facturas, almacén, rutas ni mantenimientos automáticos.

Notación: `!` obligatorio; `?` opcional. Todas las claves `id` nuevas son `uuid` con `gen_random_uuid()` salvo que se indique otra cosa. Los registros actuales usan UUID y se conservarán cuando sea posible. Las fechas-hora son `timestamptz` (UTC); las fechas de agenda e instalación son `date` en horario de la empresa. `created_at` tiene valor por defecto `now()` y `updated_at` se mantiene con disparador. Los valores de tipo, estado y rol se restringen con `CHECK`, no con enumeraciones PostgreSQL, para facilitar cambios futuros.

## Identidad y clientes

### 1. `auth.users` — administrada por Supabase

Cuenta, correo, contraseña y sesiones. No se modifica su estructura. La oficina crea usuarios; no hay registro público. La aplicación deja de almacenar `password_hash` y la tabla propia `sessions`. **Esto requiere una migración de autenticación distinta de copiar tablas:** habrá que vincular las cuentas anteriores con los nuevos ID y establecer contraseñas nuevas; no se presupone que los hashes PBKDF2 actuales se puedan importar directamente.

### 2. `public.profiles`

| Columna | Tipo | Uso |
| --- | --- | --- |
| `id` ! | `uuid` PK/FK → `auth.users.id` | Identidad y referencia de auditoría; se desactiva, no se borra, al usuario. |
| `username` ! | `text` | Nombre corto visible; único sin distinguir mayúsculas. |
| `display_name` ! | `text` | Nombre mostrado. |
| `role` ! | `text` | `OFFICE` o `TECHNICIAN`. |
| `active` ! | `boolean` | Por defecto `true`; toda operación requiere cuenta activa. |
| `created_at` !, `updated_at` ! | `timestamptz` | Fechas de control. |

### 3. `public.clients`

`id` ! `uuid` PK; `name` ! `text`; `contact_name` ?, `phone` ?, `email` ?, `notes` ? `text`; `active` ! `boolean` por defecto `true`; `created_at` !, `updated_at` ! `timestamptz`. La baja es lógica para conservar el historial.

### 4. `public.locations`

`id` ! `uuid` PK; `client_id` ! `uuid` FK → `clients.id`; `name` !, `address` ! `text`; `contact_name` ?, `phone` ?, `access_notes` ? `text`; `active` ! `boolean` por defecto `true`; `created_at` !, `updated_at` ! `timestamptz`. Un cliente puede tener muchos locales.

### 5. `public.machines`

`id` ! `uuid` PK; `location_id` ! `uuid` FK → `locations.id`; `code` !, `type` ! `text`; `brand` ?, `model` ?, `serial_number` ?, `internal_location` ? `text`; `installation_date` ? `date`; `photo_object_key` ? `text`; `notes` ? `text`; `active` ! `boolean` por defecto `true`; `created_at` !, `updated_at` ! `timestamptz`. `UNIQUE(location_id, code)`; no se exige serie única porque puede faltar o estar repetida en datos heredados.

## Trabajos y visitas

### 6. `public.work_orders`

`id` ! `uuid` PK; `number` ! `text` único (`OT-AAAA-NNNN`); `client_id` ! `uuid` FK → `clients.id`; `location_id` ! `uuid` FK → `locations.id`; `type` ! `text` (`INSTALLATION`, `MAINTENANCE`, `BREAKDOWN`); `reported_issue` ! `text`; `assigned_technician_id` ? `uuid` FK → `profiles.id`; `status` ! `text` (`REGISTERED`, `ASSIGNED`, `IN_PROGRESS`, `PENDING_PART`, `PENDING_RETURN`, `COMPLETED`) con valor inicial `REGISTERED`; `office_notes` ?, `reopened_reason` ? `text`; `created_by_id` ! `uuid` FK → `profiles.id`; `created_at` !, `updated_at` ! `timestamptz`.

`client_id` se conserva para evitar una ruptura innecesaria con la aplicación, pero una clave compuesta o un disparador debe comprobar que el local pertenece a ese cliente. `reopened_reason` refleja el último motivo; todos los motivos quedan en `audit_logs`. Fecha y franja dejan de pertenecer al trabajo: son de cada visita.

### 7. `public.work_order_counters`

`year` ! `integer` PK; `last_value` ! `integer` positivo; `updated_at` ! `timestamptz`. Un incremento transaccional asigna cada número `OT-AAAA-NNNN` sin duplicados cuando dos personas crean trabajos al mismo tiempo.

### 8. `public.work_order_machines`

`work_order_id` ! `uuid` FK → `work_orders.id`; `machine_id` ! `uuid` FK → `machines.id`; PK compuesta `(work_order_id, machine_id)`. Un disparador comprueba que la máquina pertenezca al local del trabajo. Esta relación no sustituye a los informes: solo enumera las máquinas incluidas en el trabajo.

### 9. `public.visits`

`id` ! `uuid` PK; `work_order_id` ! `uuid` FK → `work_orders.id`; `sequence` ! `integer` positivo y único dentro del trabajo; `technician_id` ! `uuid` FK → `profiles.id`; `scheduled_date` ? `date`; `time_slot` ? `text` (`MORNING`, `AFTERNOON`); `started_at` ?, `ended_at` ? `timestamptz`; `outcome` ! `text` (`SCHEDULED`, `DRAFT`, `PENDING_PART`, `PENDING_RETURN`, `COMPLETED`), inicialmente `SCHEDULED`; `general_notes` ? `text`; `signer_name` ?, `signature_object_key` ? `text`; `signed_at` ? `timestamptz`; `created_at` !, `updated_at` ! `timestamptz`.

La oficina crea la visita al programarla; el técnico la pasa a `DRAFT` al empezar. Las visitas nuevas programadas exigen fecha y franja mediante `CHECK`; los campos solo son opcionales para visitas históricas cuya programación no pueda verificarse. Una visita cerrada exige horas válidas, resultado, nombre, firma y al menos un informe de máquina con información de trabajo. Los estados `PENDING_*` cierran y firman esa visita, pero dejan abierto el trabajo para otra visita. No se permite más de una visita abierta (`SCHEDULED`/`DRAFT`) por trabajo. La asignación del trabajo debe coincidir con el técnico de esa visita abierta; cualquier reasignación se audita. Cualquier corrección posterior es una nueva visita o actuación, no una modificación de la visita firmada.

## Máquinas provisionales y partes

### 10. `public.machine_proposals`

`id` ! `uuid` PK; `proposal_type` ! `text` (`CREATE`, `UPDATE`); `status` ! `text` (`PENDING`, `APPROVED`, `REJECTED`), inicialmente `PENDING`; `location_id` ! `uuid` FK → `locations.id`; `work_order_id` ! `uuid` FK → `work_orders.id`; `existing_machine_id` ? `uuid` FK → `machines.id` (obligatoria para `UPDATE`, vacía para `CREATE`); `approved_machine_id` ? `uuid` FK → `machines.id`; `proposed_code` !, `proposed_type` ! `text`; `proposed_brand` ?, `proposed_model` ?, `proposed_serial_number` ?, `proposed_internal_location` ? `text`; `proposed_installation_date` ? `date`; `proposed_notes` ?, `proposed_photo_object_key` ? `text`; `proposed_by_id` ! `uuid` FK → `profiles.id`; `reviewed_by_id` ? `uuid` FK → `profiles.id`; `review_notes` ? `text`; `reviewed_at` ? `timestamptz`; `created_at` ! `timestamptz`.

La aprobación enlaza `approved_machine_id` con la máquina creada o corregida. El informe ya firmado conserva su `proposal_id` original; para consultar el historial se sigue el enlace a la máquina aprobada. Una propuesta rechazada conserva el parte y el PDF.

### 11. `public.visit_machine_reports`

`id` ! `uuid` PK; `visit_id` ! `uuid` FK → `visits.id`; `machine_id` ? `uuid` FK → `machines.id`; `proposal_id` ? `uuid` FK → `machine_proposals.id`; `machine_label_snapshot` ? `text` (descripción fijada al firmar); `problem_found` ?, `work_performed` ?, `actions_taken` ?, `parts_replaced` ?, `observations` ? `text`; `created_at` !, `updated_at` ! `timestamptz`.

Exactamente una referencia, `machine_id` **o** `proposal_id`, debe estar presente. Solo un informe por máquina/propuesta en cada visita. La pieza reemplazada continúa siendo texto libre. Un disparador valida que la máquina/propuesta pertenezca al local y trabajo correspondientes; tras la firma se impiden cambios o borrado.

### 12. `public.photos`

`id` ! `uuid` PK; `report_id` ! `uuid` FK → `visit_machine_reports.id`; `object_key` !, `file_name` !, `content_type` ! `text`; `size_bytes` ! `bigint` positivo; `created_at` ! `timestamptz`. Cada foto pertenece a un informe específico. El archivo está en Storage, no dentro de PostgreSQL.

### 13. `public.documents`

`id` ! `uuid` PK; `visit_id` ! `uuid` FK → `visits.id`; `version` ! `integer` positivo, normalmente `1`; `object_key` !, `file_name` ! `text`; `content_type` ! `text` fijo a `application/pdf`; `size_bytes` ! `bigint` positivo; `sha256` ! `text` (huella del PDF); `created_at` ! `timestamptz`. `UNIQUE(visit_id, version)` y `UNIQUE(object_key)`. PDF y metadatos son inalterables; una corrección produce nueva actuación/documento, no sobrescribe el anterior.

### 14. `public.audit_logs`

`id` ! `uuid` PK; `actor_id` ! `uuid` FK → `profiles.id`; `entity_type` ! `text`; `entity_id` ! `uuid`; `action` ! `text`; `details` ! `jsonb` por defecto `{}`; `created_at` ! `timestamptz`. Solo inserciones del servidor; nadie puede editar o borrar el registro. Incluye creación, asignación, cambio de estado, firma, revisión de propuesta, reapertura y corrección. `entity_id` no tiene una FK única porque puede señalar entidades distintas.

## Archivos, permisos e integridad

`storage.buckets` y `storage.objects` los administra Supabase. Se crearían dos buckets **privados**: `partes-imagenes` (máquinas, propuestas, fotos y firmas) y `partes-documentos` (PDF). Las columnas `*_object_key` guardan la ruta del objeto; no se guardan URLs públicas. Descargas autenticadas o URLs firmadas de vida breve, siempre tras verificar el permiso. Tamaños y MIME permitidos: imágenes JPEG/PNG/WebP hasta 8 MB, firmas PNG hasta 2 MB y PDF generado por el servidor.

RLS en **todas** las tablas de `public`; sin permisos para `anon`. La oficina activa puede gestionar clientes, locales, máquinas, trabajos, programación, propuestas y usuarios; no puede editar visitas o PDF firmados. La creación o desactivación de cuentas en `auth.users` pasa por una operación de administración del servidor. Un técnico activo solo lee trabajos actualmente asignados y sus datos asociados, y escribe sus propias visitas abiertas, informes, fotos y propuestas. No puede cambiar `role`, `active`, asignación ni documentos firmados. Se restringen también las operaciones de Storage. Los permisos no se basan en `user_metadata` editable; las políticas de rol pueden usar una función privada y auditada para evitar recursión sobre `profiles`. Las operaciones críticas se ejecutan de forma transaccional y vuelven a comprobar rol, estado y asignación en el servidor; la clave privilegiada nunca llega al navegador. La lectura histórica por un técnico que ya no está asignado queda denegada por defecto.

Las claves históricas usan `RESTRICT`/`NO ACTION`, no borrado en cascada de clientes, máquinas, visitas o PDF. Se desactivan cuentas y registros comerciales en vez de eliminarlos. Disparadores de integridad impiden editar o borrar visitas firmadas, sus informes/fotos y documentos; Storage debe impedir `upsert`, reemplazo y borrado de esos objetos.

Además de PK y `UNIQUE`, se indexan todas las FK no cubiertas por otra clave. Índices de consulta: `work_orders(assigned_technician_id, status)`, `work_orders(client_id, created_at)`, `visits(technician_id, scheduled_date)`, `visits(scheduled_date, time_slot)`, `visit_machine_reports(machine_id, visit_id)`, `machine_proposals(approved_machine_id)` y propuestas pendientes por estado/fecha, `audit_logs(entity_type, entity_id, created_at)`. Un índice único parcial impide dos visitas abiertas del mismo trabajo. Los filtros menos frecuentes se medirán antes de añadir más índices.

## Diferencias de migración y decisiones pendientes

1. **Acceso:** recomendación: Supabase Auth con correo y contraseña, conservando `username` como nombre corto. El acceso actual es por usuario, sin correo; confirmar si se acepta cambiar el identificador de entrada. Mantener usuario sin correo exige un diseño de autenticación distinto.
2. **Programación:** la fecha/franja pasan del trabajo a cada visita para conservar programaciones futuras. Al migrar, las órdenes asignadas sin visita reciben una visita `SCHEDULED`. La programación de visitas ya realizadas se copia solo si aparece en datos o auditoría verificables; una franja o reprogramación histórica que nunca se guardó queda vacía, sin inventarla. Confirmar si se acepta este ajuste funcional.
3. **Alcance:** confirmar Supabase alojado (propuesta) frente a instalar Supabase completo en el VPS. El VPS, si se usa, alojaría la web; no la base de datos gestionada.

Antes de ejecutar: inventariar datos y archivos actuales, probar conversión de UUID/fechas, mapear ID de usuarios, migrar claves de archivos, aplicar esquema/RLS en entorno de prueba, verificar cada rol y comparar conteos e historial. La publicación y el respaldo/restauración se diseñarán y probarán en la fase de implementación. Ningún dato se cambia con este documento.

## Referencias oficiales

- [Supabase: gestión de usuarios y perfiles](https://supabase.com/docs/guides/auth/managing-user-data).
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).
- [Supabase: buckets privados](https://supabase.com/docs/guides/storage/buckets/fundamentals).
