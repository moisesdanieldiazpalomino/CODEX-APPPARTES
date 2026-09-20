# 004 — Supabase con acceso por nombre de usuario

**Estado:** implementado parcialmente el 20 de septiembre de 2026; falta verificar la conexión local y subir archivos cuando estén las credenciales.

## Decisión

Se usa PostgreSQL alojado en el proyecto Supabase `TUTORIAL-CODEX` y dos buckets privados de Storage. La aplicación sigue pidiendo **nombre de usuario y contraseña**, sin correo. Supabase Auth no admite ese identificador directamente; para conservar los accesos existentes se migraron las tablas propias `users` y `sessions` y los hashes PBKDF2, aunque no se copiaron las sesiones activas: todos deberán volver a iniciar sesión. La oficina continúa creando, desactivando y restableciendo cuentas.

La aplicación local pasa de Vinext/Cloudflare a Next.js en Node y se conecta a PostgreSQL con Drizzle y Postgres.js. `DATABASE_URL` y `SUPABASE_SECRET_KEY` viven únicamente en `.env.local`, fuera del control de versiones. La clave secreta solo se usa en el servidor para Storage. Todas las tablas de aplicación tienen RLS habilitado **sin políticas ni permisos de lectura/escritura para `anon` o `authenticated`**; la autorización por oficina/técnico sigue en el servidor. No se considera esto una sustitución de la revisión de seguridad antes de publicar.

La fecha y franja actuales siguen en `work_orders` para la agenda existente; al iniciar cada visita se copian a `visits.scheduled_date` y `visits.time_slot`, conservando el dato por visita. Ambos campos son obligatorios en la tabla de visitas y el servidor exige programarlos antes de asignar o iniciar. Los dos registros históricos se importaron con el valor disponible en su orden, que podría no reflejar una reprogramación anterior. El estado `SCHEDULED` se reserva en la base para una futura programación anticipada; el flujo actual crea la fila al comenzar la visita.

La aprobación de una máquina provisional rellena `approved_machine_id` en la propuesta sin alterar un informe firmado. El PDF tiene clave única y huella SHA-256; visitas, informes, fotos y documentos firmados quedan protegidos contra cambios en PostgreSQL. El servidor no sobrescribe objetos en Storage.

## Migración y reversibilidad

Se hizo una copia íntegra de SQLite y R2 en `backups/pre-supabase-20260920-110324/` (ignoradas por Git), con `PRAGMA integrity_check = ok`. Se importaron 4 usuarios, 2 clientes, 2 locales, 3 máquinas, 3 órdenes, 2 visitas, 2 informes, 1 foto, 1 PDF y 7 registros de auditoría; los conteos de PostgreSQL coinciden. No se copiaron sesiones efímeras. Después se añadieron un cliente ficticio marcado `DEMO`, un local, dos máquinas y el trabajo `OT-2026-0004` mediante `supabase/seed.sql`. Los tres archivos respaldados se subieron a Storage privado y se descargaron para verificar sus huellas SHA-256.

El antiguo estado de Wrangler no se borra. Para volver a utilizarlo haría falta restaurar la versión anterior del código, ya que la aplicación actual se orienta a Supabase. No se aplicarán cambios destructivos al respaldo.
