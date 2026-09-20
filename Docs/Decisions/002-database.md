# 002 — Base de datos y archivos locales

Estado: decisión histórica de la etapa local; sustituida por [004 — Supabase con acceso por nombre de usuario](004-supabase-username-migration.md). Se conserva para documentar el origen de los datos.

## Contexto

La aplicación necesita historial por máquina, varias visitas por orden y archivos asociados. Se requiere empezar en un solo PC sin perder la posibilidad de despliegue posterior.

## Decisión

Usar Drizzle con el binding Cloudflare D1 `DB`, cuya ejecución local se basa en SQLite. El esquema está en `db/schema.ts`; las migraciones SQL se generan en `drizzle/`. Las fotos, firmas y PDF se almacenan mediante el binding R2 `BUCKET` y sus claves se guardan en D1. Wrangler persiste ambos servicios localmente en `.wrangler/state/`.

## Consecuencias

El modelo y las operaciones se conservan al pasar de entorno local a uno publicado, pero el almacenamiento local depende del estado de Wrangler. `.wrangler/state/` está fuera del código fuente lógico e ignorado por Git, aunque permanece dentro de la carpeta del proyecto. No existe todavía un procedimiento automatizado y probado de copia/restauración; no borres esa carpeta si contiene datos reales. Revisa SQL antes de aplicar migraciones y no repitas migraciones ya ejecutadas.
