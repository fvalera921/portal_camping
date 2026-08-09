# agents.md — Portal Camping

Contexto completo para cualquier agente que entre en frío en este proyecto.

## Propósito

Aplicación web de gestión de parcelas para un camping de 100 parcelas: mapa visual de
ocupación día a día, alta de reservas con líneas de concepto (adultos, niños, vehículos,
electricidad, mascotas...), cálculo de totales y check-out.

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS**
- **SQLite** vía **Prisma 7** (con adaptador `@prisma/adapter-better-sqlite3`, requerido en
  Prisma 7 — ya no basta con poner `url` en `schema.prisma`). Pensado para migrar a Postgres
  cambiando el `datasource provider`, el adaptador (`@prisma/adapter-pg`) y `DATABASE_URL`.
- **Vitest** para tests unitarios (`lib/__tests__`)
- Sin autenticación en fase 1. Ver `lib/auth.ts`: expone un `getSession()` stub que siempre
  autoriza. Cuando se añada auth real (NextAuth, Clerk, lo que sea), sustituir esa función y
  envolver las rutas de `/app/api/**/route.ts` con la comprobación — están escritas para
  llamarlo, no para asumir que no existe.
- Formato de moneda: EUR, formato español (`es-ES`, coma decimal) vía `lib/dinero.ts`.

## Estructura de carpetas

```
/app
  layout.tsx, page.tsx              → mapa principal de parcelas
  parcelas/[numero]/page.tsx        → detalle de parcela + historial + checkout
  api/parcelas/route.ts             → GET listado con estado calculado para una fecha
  api/parcelas/[numero]/route.ts    → GET detalle + historial de una parcela
  api/reservas/route.ts             → POST crear reserva (valida solapamiento en servidor)
  api/reservas/[id]/route.ts        → PATCH checkout / cancelar
  api/tarifas/route.ts              → GET / PATCH tarifas
  generated/prisma/                 → cliente Prisma generado (NO editar a mano, ignorado en git)
/components                         → componentes de UI (mapa, panel de reserva, etc.)
/lib
  db.ts             → singleton de PrismaClient con el adaptador de SQLite
  dinero.ts         → formatEUR, eurosACentimos — SIEMPRE usar esto, nunca floats a pelo
  temporada.ts      → sugerirTemporada(fechaEntrada, fechaSalida) + esFestivo
  precios.ts        → cálculo de subtotales y totales de una reserva
  validaciones.ts   → solapamiento de fechas, fechaSalida > fechaEntrada
  estadoParcela.ts  → LIBRE / OCUPADA / RESERVADA para una parcela en una fecha dada
  auth.ts           → stub de sesión (ver arriba)
/prisma
  schema.prisma, migrations/, seed.ts
/lib/__tests__       → tests de Vitest (precios y solapamientos son prioridad)
.claude/agents/      → subagentes security-reviewer y performance-optimizer
```

## Modelo de datos

- **Parcela**: `numero` (1-100, único), `tipo` (`TIENDA` | `CARAVANA` | `AUTOCARAVANA`),
  `tieneElectricidad`, `notas`. El estado (LIBRE/OCUPADA/RESERVADA) **no se almacena**, se
  calcula en `lib/estadoParcela.ts` para una fecha dada.
- **Reserva**: `parcela`, `fechaEntrada`, `fechaSalida`, `temporada` (`BAJA` | `ALTA`, la que
  elige el usuario manda — `sugerirTemporada` solo propone), datos de cliente (nombre,
  DNI/pasaporte, teléfono, email, matrícula), `totalCentimos`, `estado` (`CONFIRMADA` |
  `EN_CURSO` | `FINALIZADA` | `CANCELADA`), `lineas[]`.
- **LineaConcepto**: `concepto`, `cantidad`, `precioUnitarioCentimos` (congelado en el momento
  de la reserva), `subtotalCentimos` = `cantidad × precioUnitarioCentimos × nº de noches`.
- **Tarifa**: `concepto` (único), `precioBajaCentimos`, `precioAltaCentimos`. Es la única
  fuente de precios — nunca hardcodear cifras de tarifa en componentes o rutas.

## Reglas de negocio críticas (no negociables)

1. **Dinero siempre en céntimos como `Int`.** Nunca floats para cálculos monetarios. Convertir
   euros→céntimos solo en los bordes (seed, formularios) con `eurosACentimos` de `lib/dinero.ts`,
   y formatear para mostrar con `formatEUR`.
2. **Precios congelados**: al confirmar una reserva, cada `LineaConcepto` guarda el
   `precioUnitarioCentimos` vigente en ese momento. Cambiar `Tarifa` después **no** debe alterar
   el total de reservas ya creadas. Nunca recalcular `subtotalCentimos`/`totalCentimos` de una
   reserva existente a partir de la tabla `Tarifa` actual.
3. **No solapamientos**: una parcela no puede tener dos reservas (`CONFIRMADA`/`EN_CURSO`) con
   rangos de fechas que se crucen. La validación es **server-side**, en el handler de
   `POST /api/reservas` (`lib/validaciones.ts`), no solo en el cliente. Regla de solape:
   `NOT (salidaExistente <= nuevaEntrada OR entradaExistente >= nuevaSalida)`.
4. `fechaSalida` debe ser estrictamente posterior a `fechaEntrada`.
5. `fechaSalida` es **exclusiva** al contar noches y al decidir la temporada: la noche del día
   de salida no cuenta.
6. El estado visual de una parcela depende de la fecha seleccionada en el mapa, no siempre de
   "hoy" — ver `lib/estadoParcela.ts`.

## Convenciones de código

- Nombres de dominio en español (`Parcela`, `Reserva`, `sugerirTemporada`...) para que el
  vocabulario del código coincida con el del negocio.
- Sin comentarios explicativos de "qué hace" el código; solo cuando el porqué no es obvio
  (ver ejemplo en `lib/temporada.ts` sobre el algoritmo de Meeus).
- Los helpers de `lib/` son funciones puras cuando es posible, para poder testearlas sin DB.
- Todas las mutaciones de datos pasan por las rutas de `app/api/**`, nunca por Server Actions
  que salten la validación de solapamiento.

## Comandos

```bash
npm run dev          # servidor de desarrollo
npm run build         # build de producción
npm run test           # vitest run (una vez)
npm run test:watch      # vitest en modo watch
npm run lint            # eslint
npx prisma migrate dev --name <nombre>   # nueva migración
npm run db:seed           # ejecuta prisma/seed.ts (100 parcelas + 9 tarifas)
npm run db:studio          # Prisma Studio para inspeccionar datos
```

## Qué NO hacer

- No hardcodear precios de tarifas en componentes, rutas o seeds fuera de la tabla `Tarifa`
  (el seed inicial en `prisma/seed.ts` es la única excepción, y solo porque *es* el seed).
- No usar `number` (float) para dinero. No usar `parseFloat`/`toFixed` para cálculos, solo para
  presentación puntual si `formatEUR` no aplica.
- No mutar tarifas y esperar que las reservas existentes cambien de precio — recuerda la regla
  de precios congelados.
- No validar el solapamiento de fechas solo en el cliente/formulario.
- No editar nada dentro de `app/generated/prisma/` (se regenera con `prisma generate`).
- No añadir autenticación real todavía, pero tampoco escribir código que asuma que nunca
  existirá (usa el stub de `lib/auth.ts`).
- No introducir Postgres-only features en el schema que compliquen la migración futura sin
  necesidad.

## Estado del proyecto (mantener actualizado al final de cada fase)

- **Fase 0** ✅ — scaffold Next.js + Prisma (SQLite, adaptador better-sqlite3) + Vitest.
- **Fase 1** ✅ — schema Prisma completo, migración inicial, seed (100 parcelas + 9 tarifas),
  `lib/dinero.ts`, `lib/temporada.ts` (+ tests), `agents.md`, subagentes de revisión. Revisada
  por security-reviewer (sin hallazgos bloqueantes) y performance-optimizer (añadido índice en
  `LineaConcepto.reservaId`). Pendiente a vigilar en Fase 2: el índice compuesto de `Reserva`
  lleva `parcelaId` como columna líder — si el endpoint del mapa consulta reservas por rango de
  fecha sin filtrar por parcela, valorar un índice adicional `(estado, fechaEntrada, fechaSalida)`.
- **Fase 2** ✅ — mapa visual de las 100 parcelas, `GET /api/parcelas?fecha=`, filtros,
  contadores. Revisada por security-reviewer (sin hallazgos bloqueantes; detectó que
  `lib/auth.ts` estaba documentado pero no creado — ya añadido) y performance-optimizer
  (añadido índice `Reserva(estado, fechaEntrada, fechaSalida)` para la query del mapa, que no
  usaba el índice existente por no filtrar por `parcelaId`; `ParcelaCelda` y
  `ContadoresOcupacion` memoizados con `React.memo`/`useMemo`).
- **Fase 3** ⏳ — panel de reserva (`POST /api/reservas`, precios congelados desde `Tarifa`,
  solapamiento verificado dentro de una transacción), detalle de parcela con historial
  (`app/parcelas/[numero]`), checkout/cancelación (`PATCH /api/reservas/[id]`). Verificada
  manualmente end-to-end (crear reserva, solapamiento rechazado con 409, intento de manipular
  el precio desde el cliente ignorado, checkout libera la parcela). Pendiente: revisión de
  security-reviewer/performance-optimizer. Nota para Fase 4: la creación envuelve la
  comprobación de solapamiento y el `create` en `prisma.$transaction`, pero conviene añadir un
  test de concurrencia real (dos peticiones simultáneas) en la suite de tests.
- **Fase 4** ⏳ — validaciones endurecidas + suite de tests completa.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
