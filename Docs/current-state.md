# Estado actual

Actualizado: 20 de septiembre de 2026.

## Implementado en el código

- Acceso individual con perfiles de oficina y técnico, sesión por cookie y restricciones del lado del servidor.
- Alta de clientes, locales, máquinas, usuarios y órdenes de instalación, mantenimiento o avería.
- Asignación y programación por fecha y franja; estados registrado, asignado, en curso, pendiente de pieza, pendiente de volver y terminado.
- Visitas con informes por máquina, fotos, piezas como texto libre, firma, PDF y propuestas de máquina provisional.
- Pantallas de oficina y técnico, búsqueda básica e historial de máquinas.
- Ejecución local preparada para Next.js con PostgreSQL y Supabase Storage. El estado previo de D1/R2 se conserva como respaldo; la conexión nueva aún requiere credenciales locales.

## Pendiente o no verificado

- Hay quince pruebas automatizadas de utilidades de migración, contraseñas y programación de visitas, pero todavía no cubren los flujos completos de negocio ni existe una prueba integral con PC, móvil y tableta. Las búsquedas avanzadas y algunos flujos de corrección requieren revisión funcional.
- Los scripts `start:local` y `backup` están declarados, pero faltan sus archivos; no hay copia/restauración probada.
- No se ha validado el acceso desde otros dispositivos por Wi‑Fi ni el despliegue en internet. No hay modo sin conexión ni envío real de PDF por correo.
- El código operativo sigue en `app/`, `components/`, `lib/` y `db/`; `src/` es una reserva para una migración posterior.

## Cambio documental actual

Se añadieron `Docs/`, `src/` y `test/`, se reemplazó el README heredado del starter y se incorporó sincronización bidireccional de `AGENTS.md` y `Claude.md`. El servidor de desarrollo vigila ambas guías; `npm run docs:sync` y `npm ci` restauran el enlace físico, y `npm run docs:check` compara su contenido. Se comprobó que una edición en `Claude.md` se refleja de inmediato en `AGENTS.md` mediante el enlace local.

## Mejora visual actual

Se renovaron la paleta, la tipografía, el acceso, la configuración inicial, la navegación y las pantallas de resumen y trabajos. La agenda de hoy es el foco del resumen; los indicadores quedan en segundo plano. En móvil, la oficina puede llegar a Propuestas y Usuarios desde «Más», y el cierre de sesión está disponible en el encabezado. Las demás fichas y formularios adoptan los nuevos colores y componentes compartidos sin cambios en las reglas de negocio. Se comprobó el acceso en anchos de 390, 768 y 1440 px y, con una cuenta técnica de demostración, el resumen, el detalle de trabajo y el parte en móvil sin desbordamiento horizontal. Compilación y TypeScript pasan; ESLint termina sin errores y con tres advertencias de importaciones anteriores. La sesión de oficina no se verificó visualmente porque no hay credenciales de prueba disponibles.

## Estado de inicio de sesión

Al enviar el formulario, el botón muestra «Iniciando sesión…» con indicador de actividad, queda desactivado para evitar envíos dobles y anuncia la comprobación a tecnologías de asistencia. El indicador respeta la preferencia de movimiento reducido. Las respuestas de error siguen apareciendo en el formulario; no cambian la acción ni las reglas de autenticación. Se verificaron TypeScript y compilación; ESLint terminó sin errores y con las mismas tres advertencias previas. Queda pendiente comprobar visualmente el estado durante una autenticación lenta.

## Seguimiento de tareas

El cuaderno [App de Partes](https://app.notion.com/p/3490b826c6f44d54ae47543a35451b75) en Notion contiene una tabla con nombre, descripción, fecha prevista, fecha de implementación, urgencia y estado. Se registraron como pendientes la configuración de la base de datos para el entorno objetivo, el despliegue en VPS y la revisión de seguridad. Fechas y urgencias permanecen sin asignar hasta acordarlas.

## Propuesta de migración a Supabase

Se documentó el [modelo inicial de Supabase](Decisions/003-supabase-schema-proposal.md). Es una propuesta histórica: la decisión de usar nombre de usuario y conservar la autenticación propia se registra en la [decisión 004](Decisions/004-supabase-username-migration.md).

## Migración a Supabase y conexión local

La propuesta anterior quedó sustituida por la [decisión 004](Decisions/004-supabase-username-migration.md): se conserva el acceso con nombre de usuario y contraseña. El proyecto `TUTORIAL-CODEX` recibió 14 tablas propias con RLS sin permisos públicos, dos buckets privados y la importación de los registros D1 existentes. Los conteos de la importación coincidieron con el respaldo verificado; las sesiones se excluyeron para forzar un nuevo acceso. Se añadieron un cliente ficticio `DEMO`, un local, dos máquinas y la orden `OT-2026-0004`. El código usa Next.js, PostgreSQL y Supabase Storage; fecha y franja son obligatorias en cada visita y se copian desde la agenda al iniciarla. Con `.env.local` configurado, la conexión PostgreSQL confirmó las cuatro cuentas migradas y los tres archivos del respaldo se subieron a buckets privados y se descargaron para verificar SHA-256. Después apareció una quinta cuenta técnica creada desde la aplicación; no se alteró. El texto del acceso indica que los datos están en Supabase, aunque la web se ejecuta en este PC. Se inició sesión con `tecnico2`, se comprobó que veía su trabajo asignado y se cerró la sesión; la pestaña quedó en el formulario de acceso. TypeScript, compilación, lint (una advertencia previa) y quince pruebas pasan. Falta probar los flujos completos con PC, móvil y tableta. Se detuvo una vista previa antigua de Vinext que ocupaba IPv6 y sobrescribía tipos generados; después se regeneraron los tipos de Next.js y `http://localhost:5173/login` mostró la versión conectada a Supabase. El estado antiguo `.wrangler/` no se borró.

## Control de versiones

Se preparó Git local con rama `main` y un primer commit del estado actual. `.gitignore` excluye credenciales, respaldos, datos locales, dependencias, cachés y compilaciones; `.env.example` contiene solo marcadores. `AGENTS.md` y `Claude.md` siguen sincronizados y en español. Para impedir que Next.js vuelva a añadir un bloque en inglés, `next.config.ts` desactiva su generación automática de reglas de agente; la guía propia mantiene el enlace a la documentación local de Next.js. No se configuró un remoto ni se publicaron archivos. Véase [decisión 005](Decisions/005-git-local.md).
