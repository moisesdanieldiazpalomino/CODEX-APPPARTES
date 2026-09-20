# 002 — Autenticación y permisos

Estado: esquema de acceso conservado en PostgreSQL por [004 — Supabase con acceso por nombre de usuario](004-supabase-username-migration.md); requiere revisión de seguridad antes del despliegue público.

## Contexto

La oficina debe ver y asignar todos los trabajos; cada técnico solo debe acceder a los suyos. No se permite registro público.

## Decisión

Mantener usuarios propios con perfiles `OFFICE` y `TECHNICIAN` en D1. La primera cuenta de oficina se crea únicamente cuando la tabla de usuarios está vacía. Después, la oficina administra las cuentas. Las contraseñas se derivan con PBKDF2-SHA-256 (210 000 iteraciones y sal aleatoria). Una sesión usa un token aleatorio cuyo hash se guarda en D1; la cookie HTTP-only dura siete días. `lib/auth.ts` y las acciones/consultas protegidas comprueban identidad y permisos del lado del servidor.

## Consecuencias

El cliente no decide los permisos. Las descargas de archivos también deben validar que el usuario puede consultar la orden relacionada. Para publicar en internet se necesita HTTPS, `COOKIE_SECURE=1`, revisión de controles de acceso y pruebas de aislamiento entre técnicos. No se deben documentar contraseñas ni tokens reales.
