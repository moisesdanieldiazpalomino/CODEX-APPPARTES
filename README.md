# ClimaControl

Aplicación para gestionar partes de trabajo de una empresa de aire acondicionado. La oficina registra clientes, locales, máquinas y trabajos; los técnicos consultan sus asignaciones y completan visitas desde móvil o tableta. Esta etapa no incluye facturación, nóminas, contabilidad, almacén, rutas ni uso sin conexión.

## Inicio local

Requiere Node.js 24 LTS (mínimo 22.13). La web corre en el PC, pero los datos se guardan en el proyecto Supabase `TUTORIAL-CODEX`. En la raíz, crea `.env.local` con los valores obtenidos en **Connect → Transaction pooler** y **Settings → API Keys** del proyecto:

```env
DATABASE_URL=postgresql://usuario:contraseña@servidor:6543/postgres
SUPABASE_SECRET_KEY=sb_secret_valor_real
```

Reemplaza el usuario, contraseña, servidor y clave por los valores reales; no incluyas comentarios en esas líneas ni compartas las claves por chat. `SUPABASE_URL` es opcional y por defecto apunta a `https://hyhgxnwjnyxinzjhaywa.supabase.co`. Desde la raíz:

```sh
npm ci
npm run dev
```

Abre `http://localhost:5173/` e inicia sesión con el **usuario y la contraseña anteriores**. Se migraron las cuentas y sus hashes, pero no las sesiones, así que hay que entrar de nuevo. En una base realmente vacía, `/setup` crea la primera cuenta de oficina. Al asignar un técnico, fecha y franja son obligatorias y quedan guardadas en cada visita. Para revisar cambios: `npm run build`, `npm run lint`, `npx tsc --noEmit` y `npm test`.

Las migraciones reproducibles están en `supabase/migrations/`. El proyecto elegido ya recibió el esquema y los registros locales; no vuelvas a aplicarlos. `supabase/seed.sql` añade datos ficticios marcados `DEMO` sin borrar los existentes. El respaldo original de D1/R2 está en `backups/pre-supabase-20260920-110324/`, ignorado por Git. Para subir y verificar sus tres archivos, con `.env.local` configurado, ejecuta `node --env-file=.env.local scripts/upload-supabase-files.mjs backups/pre-supabase-20260920-110324`. Consulta [la decisión de migración](Docs/Decisions/004-supabase-username-migration.md).

## Organización y documentación

- `app/`, `components/`, `lib/`, `db/`: implementación actual. `src/` queda reservado para una migración posterior; no se ha movido código para evitar romper las rutas.
- `test/`: pruebas nuevas; `public/`: recursos estáticos; `scripts/`: utilidades de ejecución, migración y sincronización; `supabase/`: migraciones y datos de prueba.
- [Arquitectura](Docs/arquitecture.md): componentes y flujos; [estado actual](Docs/current-state.md): capacidades y pendientes; `Docs/Decisions/`: decisiones de base de datos y autenticación.
- `AGENTS.md` y `Claude.md` contienen la misma guía. Son enlaces físicos locales; `npm run docs:check` comprueba el contenido, `npm run docs:sync` restaura el enlace y `npm run docs:watch` observa cambios si no está activo el servidor de desarrollo. `npm ci` también restaura el enlace mediante `prepare`.

Actualiza el documento correspondiente cada vez que cambies código, configuración o comportamiento. No subas `.env.local`, contraseñas, fotos, firmas, PDF, `backups/` ni el antiguo estado `.wrangler/`. Los comandos `start:local` y `backup` todavía no están implementados.

## Control de versiones

El proyecto usa Git local en la rama `main`; todavía no tiene remoto. Para preparar otra copia, ejecuta `Copy-Item .env.example .env.local` en PowerShell y sustituye los marcadores por tus credenciales, sin subir el archivo. Antes de cada commit, revisa `git status` y `git diff --cached --name-only`; confirma únicamente código, migraciones, pruebas y documentación. Consulta la [decisión 005](Docs/Decisions/005-git-local.md).
