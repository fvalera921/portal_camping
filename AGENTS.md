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
  api/frigorificos/route.ts         → GET disponibilidad de los 8 frigorificos para un rango
  generated/prisma/                 → cliente Prisma generado (NO editar a mano, ignorado en git)
/components                         → componentes de UI (mapa, panel de reserva, etc.)
/lib
  db.ts             → singleton de PrismaClient con el adaptador de SQLite
  dinero.ts         → formatEUR, eurosACentimos — SIEMPRE usar esto, nunca floats a pelo
  temporada.ts      → sugerirTemporada(fechaEntrada, fechaSalida) + esFestivo
  precios.ts        → cálculo de subtotales y totales de una reserva
  validaciones.ts   → solapamiento de fechas/frigorificos, fechaSalida > fechaEntrada
  estadoParcela.ts  → LIBRE / OCUPADA / RESERVADA para una parcela en una fecha dada
  frigorificos.ts   → disponibilidad de los 8 frigorificos para un rango de fechas
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
- **Frigorifico**: recurso compartido del camping, solo **8 unidades** (`numero` 1-8, único).
  Una `Reserva` puede tener a lo sumo 1 frigorifico asignado (`frigorificoId` nullable +
  `frigorificoFechaEntrada`/`frigorificoFechaSalida`, también nullable). Ese rango de fechas es
  **independiente** del de la parcela: por defecto coincide, pero el usuario puede acortarlo
  (nunca alargarlo más allá del rango de la reserva). Se cobra como una `LineaConcepto` más
  (`concepto = "FRIGORIFICO"`, `cantidad = 1`), calculada con las noches del rango del
  frigorifico, no las de la parcela. **Precio pendiente**: el usuario del proyecto confirmó que
  tiene coste pero no dio la cifra; `Tarifa` tiene la fila `FRIGORIFICO` sembrada a 0 €/0 € como
  placeholder — actualizar `prisma/seed.ts` (o `Tarifa` directamente) en cuanto se conozca el
  precio real y volver a correr `npm run db:seed`.

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
7. **Frigorificos sin solapamiento**: solo hay 8; la misma regla de solapamiento de parcelas
   aplica a `Reserva.frigorificoId` + su propio rango de fechas (`existeSolapamientoFrigorifico`
   en `lib/validaciones.ts`), y su rango debe caer dentro de `[fechaEntrada, fechaSalida]` de
   la reserva a la que pertenece.

## Convenciones de código

- Nombres de dominio en español (`Parcela`, `Reserva`, `sugerirTemporada`...) para que el
  vocabulario del código coincida con el del negocio.
- Sin comentarios explicativos de "qué hace" el código; solo cuando el porqué no es obvio
  (ver ejemplo en `lib/temporada.ts` sobre el algoritmo de Meeus).
- Los helpers de `lib/` son funciones puras cuando es posible, para poder testearlas sin DB.
- Todas las mutaciones de datos pasan por las rutas de `app/api/**`, nunca por Server Actions
  que salten la validación de solapamiento.
- Fechas de negocio (`fechaEntrada`, `fechaSalida`, fecha del mapa...) siempre se construyen con
  `parseFechaISO`/`inicioDia` de `lib/fechas.ts`, nunca con `new Date(stringISO)`: la forma
  "solo fecha" de `new Date()` se interpreta como medianoche UTC, no local, y puede desplazar
  el día según la zona horaria — un bug real que apareció en `lib/__tests__/solapamiento.test.ts`
  por mezclar ambas formas.

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
- No dejar que el rango de fechas de un frigorifico se salga del rango `[fechaEntrada,
  fechaSalida]` de la reserva a la que pertenece — validar siempre en servidor
  (`app/api/reservas/route.ts`), no confiar solo en los `min`/`max` del `<input type="date">`.
- No olvidar actualizar el precio de `FRIGORIFICO` en `Tarifa` (hoy 0 €, placeholder) en cuanto
  el usuario del proyecto lo confirme.

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
- **Fase 3** ✅ — panel de reserva (`POST /api/reservas`, precios congelados desde `Tarifa`,
  solapamiento verificado dentro de una transacción), detalle de parcela con historial
  (`app/parcelas/[numero]`), checkout/cancelación (`PATCH /api/reservas/[id]`). Verificada
  manualmente end-to-end (crear reserva, solapamiento rechazado con 409, intento de manipular
  el precio desde el cliente ignorado, checkout libera la parcela).
  Revisada por security-reviewer (confirmó que la regla de precios congelados es correcta —
  el precio nunca lo manda el cliente; corregida sobre-exposición de PII en
  `GET /api/parcelas/[numero]`, que devolvía DNI/teléfono/email/matrícula de todo el
  histórico sin que ningún consumidor los usara — ahora usa `select` explícito y solo expone
  `clienteNombre`) y performance-optimizer (confirmó que la resolución de tarifas en
  `POST /api/reservas` ya usa una sola query `IN`, sin N+1; confirmó que `prisma.$transaction`
  serializa correctamente la comprobación de solapamiento + creación gracias al mutex del
  adaptador better-sqlite3 — con la salvedad de que ese mutex es solo intra-proceso, revisar
  al migrar a Postgres o desplegar multi-proceso; acotado el historial de `app/parcelas/[numero]`
  con `select`+`take: 50` y evitada la query de tarifas cuando la parcela no está LIBRE).
- **Fase 4** ✅ — suite de tests completa (36 tests): `lib/__tests__/precios.test.ts` (cálculo
  de subtotales/totales), `lib/__tests__/solapamiento.test.ts` (integración contra una BD
  SQLite real y aislada por test file — ver `lib/__tests__/helpers/testDb.ts`, que aplica las
  migraciones reales del proyecto; cubre solapamiento total/parcial/contenido, contiguas en
  ambos sentidos, `CANCELADA`/`FINALIZADA` no bloquean, `EN_CURSO` sí bloquea, aislamiento entre
  parcelas), `lib/__tests__/preciosCongelados.test.ts` (una reserva conserva su precio aunque
  `Tarifa` cambie después). Durante esta fase el propio test de "contiguas" detectó un bug —
  en el *test*, no en la app: construir fechas con `new Date("2026-01-05")` (interpretado como
  medianoche UTC) en vez de `parseFechaISO`/construcción por componentes (medianoche local) da
  fechas distintas y falseaba el resultado. Confirma por qué `AGENTS.md` insiste en no usar
  `new Date(string)` para fechas de negocio en ningún sitio del proyecto, tests incluidos.
  Revisada por security-reviewer (hallazgo bajo: `crearClientePrueba` no validaba el nombre de
  fichero recibido, riesgo de mantenimiento futuro si alguien pasa una ruta fuera de `prisma/`;
  ahora valida contra un patrón `test-*.db`) y performance-optimizer (hallazgos bajos de
  limpieza de recursos: `crearClientePrueba` ahora borra los 4 sufijos SQLite antes de crear el
  fichero, no solo el principal, y el bucle de migraciones va en `try/finally` para no dejar el
  handle de `better-sqlite3` abierto si una migración falla). Con el proyecto completo: 36 tests
  en verde, build/lint/typecheck limpios en las 4 fases.

**Todas las fases del plan original están completas.** Próximos pasos naturales si se retoma el
proyecto: autenticación real (enganchar sobre `lib/auth.ts`), edición de tarifas desde la UI
(`PATCH /api/tarifas`, hoy solo hay `GET`), rate limiting en los endpoints mutantes, y paginación
del historial de reservas si una parcela supera las 50 reservas (`app/parcelas/[numero]/page.tsx`).

### Cambios posteriores a la Fase 4

- **UI**: quitados todos los emoticonos del mapa de parcelas (`ParcelaCelda.tsx` ahora usa solo
  texto para tipo/electricidad/estado, ya accesible sin iconos). Forzado el fondo a blanco
  siempre (`app/globals.css`): se quitó el bloque `@media (prefers-color-scheme: dark)` que
  ponía fondo casi negro cuando el sistema operativo tenía tema oscuro.
- **Frigorificos** (recurso compartido, solo 8 unidades — ver modelo de datos y reglas de
  negocio más arriba): nuevo modelo `Frigorifico`, campos en `Reserva`
  (`frigorificoId`/`frigorificoFechaEntrada`/`frigorificoFechaSalida`), `lib/frigorificos.ts`
  (`obtenerDisponibilidadFrigorificos`, acepta el cliente de Prisma como parámetro igual que
  `lib/validaciones.ts` para poder testearse contra una BD aislada — **si se añade un helper de
  consulta nuevo, seguir este patrón, no hardcodear el singleton de `lib/db.ts` dentro**),
  `existeSolapamientoFrigorifico` en `lib/validaciones.ts`, `GET /api/frigorificos?fechaEntrada=
  &fechaSalida=`, `POST /api/reservas` extendido para aceptar `frigorifico: { numero,
  fechaEntrada, fechaSalida } | null` (rechaza si el rango se sale del de la reserva, si el
  número no existe, o si ese frigorifico ya está asignado en fechas solapadas — comprobado
  dentro de la misma transacción que el solapamiento de parcela). UI: `SelectorFrigorifico.tsx`
  dentro de `PanelReserva.tsx`, con disponibilidad en vivo vía fetch a `/api/frigorificos` según
  cambian las fechas; el número seleccionado se **deriva** de la disponibilidad en vez de
  corregirse con un efecto (evita el error de lint `react-hooks/set-state-in-effect` de
  `eslint-config-next` y sigue el patrón recomendado por React de no duplicar estado derivable).
  9 tests nuevos en `lib/__tests__/solapamientoFrigorifico.test.ts`. **Precio pendiente de
  confirmar** (ver Reglas de negocio). Verificado manualmente end-to-end: asignación con rango
  más corto que la parcela, liberación exacta el día que termina, rechazo de solapamiento (409),
  rechazo de rango fuera de la reserva (400), rechazo de intentar colar `FRIGORIFICO` por el
  array genérico de `lineas` (400).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
