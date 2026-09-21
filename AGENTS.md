# Guía del repositorio

## Estructura del proyecto

`app/` contiene rutas, páginas protegidas en `app/(app)/`, acciones en `app/actions.ts` y descargas autenticadas en `app/archivos/`. La interfaz está en `components/`; reglas, autenticación, PDF y almacenamiento, en `lib/`. El modelo PostgreSQL está en `db/schema.ts` y las migraciones en `supabase/migrations/`. `Docs/` reúne arquitectura, estado y decisiones. `src/` está reservado; el código aún vive en carpetas raíz. Coloca pruebas en `test/`. No edites `dist/`, `.next/`, `.vinext/` ni `.wrangler/`: son generados.

## Comandos de desarrollo y verificación

Usa Node.js 24 LTS (mínimo 22.13) y `npm ci`. Configura `DATABASE_URL` y `SUPABASE_SECRET_KEY` en `.env.local`, nunca en Git. `npm run dev` sirve en `http://localhost:5173/`; `npm run build` compila y `npm start` ejecuta lo compilado. Verifica con `npm run lint`, `npx tsc --noEmit` y `npm test`. Crea nuevas migraciones con `npx supabase migration new <nombre>`, revisa el SQL y aplícalo al proyecto correcto. `start:local` y `backup` aún no funcionan. `npm run docs:check` compara ambas guías.

## Estilo y nombres

Usa TypeScript estricto, sangría de dos espacios y comillas dobles. Nombra componentes React en `PascalCase`, funciones y acciones en `camelCase`, y rutas en español y minúsculas (`trabajos`, `clientes`). Comprueba permisos en el servidor, no solo en la interfaz. Separa datos de cada máquina de los del trabajo.
Antes de modificar código de Next.js, consulta la guía pertinente de la versión instalada en `node_modules/next/dist/docs/`.

## Pruebas

Ejecuta Vitest con `npm test` o `npm run test:watch`. `test/` cubre migración de fechas y archivos, contraseñas y programación de visitas; aún no hay umbral de cobertura. Añade `*.test.ts` en `test/`. Prioriza permisos, estados, cierre de visitas y varias máquinas por trabajo. Para cambios importantes, ejecuta lint, tipos y compilación.

## Commits y solicitudes de cambio

No ejecutes `git commit` ni `git pull` salvo que el usuario solicite explícitamente esa operación. Editar, probar o documentar no concede esa autorización.

El repositorio local usa `main` y sigue `origin/main` en GitHub. Usa títulos breves en imperativo, por ejemplo: `Validar estados de visitas`. Antes de confirmar, revisa `git status` y `git diff --cached --name-only`. En cada solicitud de cambio, explica flujo, migraciones y verificaciones; adjunta capturas si cambia la interfaz. Nunca incorpores `.env.local`, `.wrangler/`, credenciales, fotos de clientes, firmas ni PDF generados.

## Documentación obligatoria

Documenta cada cambio: estructura y flujos en `Docs/arquitecture.md`, capacidades y pendientes en `Docs/current-state.md`, decisiones en `Docs/Decisions/` y uso en `README.md`. Mantén `AGENTS.md` y `Claude.md` idénticos. `npm run dev` vigila ambos; `npm run docs:sync` restaura su enlace físico si el editor lo reemplaza.
