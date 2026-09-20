# Arquitectura

## Panorama

ClimaControl es una aplicación web adaptable para oficina (PC) y técnicos (móvil o tableta). Se ejecuta localmente con Next.js en Node y guarda los datos en Supabase PostgreSQL y Storage. Las páginas y acciones de servidor viven en `app/`; `components/` contiene la interfaz; `lib/` reúne reglas de negocio, autenticación, PDF y archivos; `db/` define el modelo y la conexión Drizzle/Postgres.js. `src/` sigue reservado.

## Interfaz y diseño

`app/globals.css` define los colores, la tipografía y las superficies compartidas. La identidad usa azul petróleo, turquesa y tonos de niebla; el ámbar se reserva para trabajos pendientes. `components/app-shell.tsx` organiza el encabezado y la sesión, mientras `components/app-navigation.tsx` marca la sección activa y ofrece acceso a todas las áreas desde móvil. El resumen prioriza la agenda de hoy sobre los indicadores. Las pantallas de acceso y configuración comparten una composición adaptable; los formularios y fichas conservan componentes reutilizables de `components/ui/`. Al añadir una pantalla, respeta esta jerarquía, los estados visibles y las áreas táctiles.

El acceso mantiene la acción de servidor en `app/actions.ts`; `components/login-submit.tsx` observa el estado pendiente del formulario con `useFormStatus`. Mientras se valida el acceso, cambia el botón a «Iniciando sesión…», muestra actividad, impide otro envío y anuncia el estado a lectores de pantalla. No añade demoras artificiales ni modifica la autenticación.

## Flujo de trabajo

La oficina crea cliente → local → máquina, registra una orden y la asigna. Para asignar un técnico debe indicar fecha y franja. El técnico solo consulta sus órdenes, inicia una visita ya programada y guarda un informe por máquina. Una visita firmada puede terminar el trabajo o dejarlo pendiente de pieza o regreso; la oficina programa otra visita en la misma orden. Las propuestas de máquinas provisionales se revisan desde oficina. Las acciones de `app/actions.ts` aplican permisos y persistencia; `lib/domain.ts` concentra estados y validaciones. El inicio de visita bloquea la orden y vuelve a comprobar estado y asignación para evitar inicios simultáneos.

## Datos y archivos

`db/schema.ts` define usuarios, sesiones, clientes, locales, máquinas, órdenes, visitas, informes, propuestas, fotos, documentos y auditoría. Drizzle usa `DATABASE_URL` para PostgreSQL. Las fechas y franjas de cada visita son obligatorias en `visits`; la orden conserva el siguiente horario para la agenda. `lib/storage.ts` guarda fotos/firmas y PDF en dos buckets privados mediante `SUPABASE_SECRET_KEY`, solo en servidor. La ruta `app/archivos/[kind]/[id]/route.ts` comprueba el acceso antes de descargar. La API pública de Supabase no tiene permisos sobre las tablas propias: la aplicación usa sus usuarios y sesiones, y aplica permisos en las acciones y consultas del servidor. Consulta la [decisión de migración](Decisions/004-supabase-username-migration.md); el antiguo D1/R2 se conserva en `backups/`.

## Documentación de cambios

Actualiza este archivo cuando cambien componentes, límites o flujos; registra funcionalidades y verificaciones en [estado actual](current-state.md). Una decisión nueva o revisada merece su propio archivo en `Docs/Decisions/`. Las instrucciones operativas van en `README.md`.
