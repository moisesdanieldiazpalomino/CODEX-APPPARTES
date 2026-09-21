# 006 — Repositorio remoto en GitHub

Estado: aceptado. Fecha: 20 de septiembre de 2026.

## Decisión

La rama local `main` sigue `origin/main` en `https://github.com/moisesdanieldiazpalomino/CODEX-APPPARTES.git`. Se conserva el historial de commits existente; no se reinicializa Git ni se crea otro «primer commit». Esta decisión amplía la [005 — Control de versiones local](005-git-local.md).

El acceso de escritura usa Git Credential Manager con la cuenta `moisesdanieldiazpalomino`. La elección de cuenta se limita a la configuración Git de este repositorio; no se guardan contraseñas ni tokens en archivos versionados.

## Consecuencias

El primer `push` publicó `main` hasta `194de7b`. Los cambios locales sin confirmar, incluida la eliminación de «Resumen» cuyo commit se retiró, no se publicaron. Los siguientes cambios deberán confirmarse antes de `git push`. Mantener las exclusiones de `.gitignore` y revisar siempre los archivos preparados.
