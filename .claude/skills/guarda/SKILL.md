---
name: guarda
description: Guarda el estado del proyecto (qué se hizo, qué falta, decisiones pendientes) en AGENTS.md, verifica que el repo está consistente, hace commit y push. Úsala al terminar una sesión de trabajo (o como checkpoint a mitad) para que otra sesión pueda retomarlo sin haber visto esta conversación.
---

# Guardar estado del proyecto

El objetivo es que cualquier sesión futura — de Claude Code o de cualquier otro agente, en esta
máquina o en otra — pueda abrir este repo en frío, leer `AGENTS.md` y saber exactamente dónde se
quedó el trabajo, sin depender de la memoria de esta conversación.

## Pasos al invocarse

1. **Revisa el estado real del repo**, no la memoria de la conversación:
   - `git status` y `git diff` para ver qué hay sin commitear.
   - `git log --oneline -10` para ver los últimos commits.
   - Compara todo esto contra lo que dice `AGENTS.md` en "Estado del proyecto" — si algo ya no
     es cierto (una fase marcada ⏳ que en realidad ya se completó, un pendiente que ya se
     resolvió), corrígelo.

2. **Verifica que el proyecto sigue en estado consistente** antes de comitear nada: build, lint,
   tests (usa los comandos de la sección "Comandos" de `AGENTS.md`). Si algo queda roto o a
   medias intencionadamente, no lo ocultes — anótalo explícitamente en el paso siguiente para que
   la próxima sesión no pierda tiempo redescubriéndolo.

3. **Actualiza `AGENTS.md`** (no lo reescribas entero — añade o corrige solo lo que haga falta):
   - Qué se completó en esta sesión.
   - Qué quedó **a medias** o **bloqueado**, y por qué (p. ej. "esperando que el usuario confirme
     el precio de X", "pendiente configurar la variable Y en Vercel").
   - Próximos pasos concretos, en el orden en que deberían abordarse.
   - Cualquier decisión de diseño o dato (URLs, nombres de recursos externos, credenciales *sin
     incluir secretos*) tomada en esta sesión que no sea obvia leyendo el código, siguiendo el
     mismo nivel de detalle que ya tienen las secciones anteriores del documento.

4. **Commit** de todo lo pendiente (código + `AGENTS.md`) con un mensaje descriptivo: qué cambia
   y por qué, siguiendo el estilo ya usado en el historial de este repo. Revisa `git status`
   después de un `git add` amplio antes de comitear, por si hay algo que no debería subirse
   (secretos, ficheros generados).

5. **Push** a `origin` de la rama actual, salvo que el usuario haya dicho explícitamente que no
   quiere pushear todavía (rama en progreso, PR sin abrir, etc.) — en ese caso, para en el commit
   local y dilo.

6. Termina con un resumen corto: qué se guardó, qué quedó pendiente/bloqueado, y qué debería
   hacer o leer la siguiente sesión para retomarlo (normalmente: "lee `AGENTS.md`").

## Qué NO hacer

- No inventes progreso que no se hizo, ni marques como completado algo a medias solo para que
  quede "bonito" en `AGENTS.md`.
- No pushees si hay conflictos o el remoto tiene commits que no están en local — para y avisa.
- No borres ni reescribas secciones de `AGENTS.md` que documentan decisiones de fases anteriores
  y siguen siendo ciertas; este comando es acumulativo, no un reset.
