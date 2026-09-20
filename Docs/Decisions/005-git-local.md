# 005 — Control de versiones local con Git

Estado: aceptado. Fecha: 20 de septiembre de 2026.

## Decisión

Se inicia un repositorio Git local en la rama `main` para versionar código, migraciones, pruebas y documentación. No se configura un remoto ni se publica el proyecto. El primer commit representa el estado actual de la aplicación conectada a Supabase.

El archivo `.gitignore` excluye `.env.local`, respaldos, bases de datos locales, archivos subidos, dependencias, compilaciones y cachés. `.env.example` contiene solo marcadores de posición y sí se versiona. Se normalizan finales de línea mediante `.gitattributes`.

Next.js no generará bloques de reglas dentro de `AGENTS.md` y `Claude.md`, porque ambas guías deben mantenerse idénticas y en español. La instrucción para consultar la documentación de la versión instalada permanece en la guía propia.

## Consecuencias

Cada cambio funcional debe actualizar su documento correspondiente antes del commit. Antes de confirmar, se revisan los archivos preparados y se ejecuta `npm run docs:check`. Para colaborar o respaldar el historial fuera del PC hará falta elegir y configurar un remoto en otra decisión.
