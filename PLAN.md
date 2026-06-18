# FFFinanzas v3 — Plan (modelo de "fondo único")

> **Qué es esto.** Plan completo para clonar FFFinanzas v2 hacia una v3 que abandona el
> saldo-por-cuenta y adopta el **modelo de fondo único**: la plata es un único pozo por
> moneda; las "cuentas" son etiquetas (medio de pago) que solo aplican al egreso.
> Diseña base de datos, backend y frontend. El frontend usa **shadcn/ui** y el lenguaje
> visual de las skills `minimalist-skill`, `taste-skill` y `frontend-design`.
>
> _Redactado: 2026-06-17. Proyecto nuevo en `C:/Users/u4334/FFF/FFFinanzas-v3`._

---

## 0. Design Read y dials (taste-skill)

- **Page kind:** producto / dashboard financiero privado (no landing).
- **Audiencia:** un único usuario power-user (invite-only), uso recurrente.
- **Vibe:** editorial-minimalista, calmo, "document-style".
- **Dials:** `DESIGN_VARIANCE 5` · `MOTION_INTENSITY 3` · `VISUAL_DENSITY 5`.
- **Sistema base:** shadcn/ui (componentes propios, nunca en estado default) + Tailwind.
- **Signature element:** un **balance único** por moneda como héroe (número grande en mono
  tabular); las cuentas dejan de ser tarjetas de saldo y pasan a ser *tags* de gasto. La
  idea de fondo único es, literalmente, la identidad visual.

---

## 1. El cambio de paradigma

**v2 (ledger por cuenta):** cada cuenta tiene moneda y saldo; ingresos/egresos afectan una
cuenta; transferencias mueven plata entre cuentas; saldo = por cuenta. Multi-moneda forzaba
una cuenta por moneda.

**v3 (fondo único):**

1. **No hay saldo por cuenta.** Hay un pozo por moneda del usuario:
   `saldo(moneda) = apertura(moneda) + Σ ingresos(moneda) − Σ egresos(moneda) + Σ exchange_in − Σ exchange_out`.
2. **El ingreso se asocia solo al usuario** (lleva moneda, no cuenta).
3. **El egreso dice de qué "cuenta"/medio sale** — etiqueta descriptiva, no acumula saldo.
4. **La moneda vive en la transacción**, no en la cuenta (resuelve multi-moneda de paso).
5. **Se eliminan las transferencias.** Lo único que mueve valor entre pozos es el
   **cambio de moneda** (exchange), que pasa a ser una operación a nivel usuario.

**Consecuencia aceptada:** se pierde "¿cuánta plata hay en BBVA / en la billetera?". A
cambio: modelo mucho más simple, multi-moneda nativo, y cero fricción de transferencias.
Si en el futuro se quiere un "¿dónde está mi plata?" aproximado, se resuelve con una acción
de **conteo/reconciliación** por moneda, no reintroduciendo transferencias.

---

## 2. Stack

Se mantiene cercano a v2 para reusar lógica, pero con la capa visual nueva.

| Capa | v2 | v3 |
|---|---|---|
| Backend | Node ESM, Express 5, `postgres` (porsager), JWT, bcrypt | **igual** |
| DB | PostgreSQL (Supabase), auth propia | **igual**, schema nuevo |
| Frontend base | React 18 + Vite | **React 18 + Vite** (SPA privada, sin necesidad de SSR) |
| Estado | Redux Toolkit (un `financeSlice` monolítico + `loadFinanceData`) | **Redux Toolkit + RTK Query** (un api-slice por recurso, cache/invalidación por tags — adiós al fetch gigante) |
| UI kit | Radix crudo + clases sueltas | **shadcn/ui** sobre Radix + Tailwind |
| Charts | Recharts | **Recharts** (vía `shadcn` chart) |
| Íconos | lucide | **Phosphor** (`@phosphor-icons/react`) — minimalist/taste prohíben lucide por default |
| Toasts | toast propio | **sonner** (shadcn) |

> Decisión: **Vite SPA**, no Next. Es una app privada detrás de login, sin SEO ni SSR; mantener
> el modelo de v2 reduce riesgo. shadcn/ui funciona con Vite. (taste-skill sugiere Next para
> landings; acá no aplica.)

---

## 3. Modelo de datos (PostgreSQL)

> Igual que v2 en `users`, `allowed_users`, `currencies`, `categories`, `transaction_groups`,
> `budget_items`. Cambia el núcleo de cuentas/transacciones y desaparecen `transfers`.
> Schema destino (se versiona en `.database/schema-v3.sql`):

### 3.1 Sin cambios respecto a v2
- `users`, `allowed_users` — auth invite-only.
- `currencies` — catálogo fijo (ARS, USD, EUR, BRL, UYU).
- `categories` — por usuario, únicas por `(user_id, name)`.
- `transaction_groups` — agrupación semántica opcional.

### 3.2 `accounts` → catálogo de medios (etiquetas, sin saldo)

```sql
CREATE TABLE public.accounts (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      bigint       NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name         varchar(100) NOT NULL,
  account_type varchar(10)  NOT NULL CHECK (account_type IN ('BANK','DIGITAL','CASH')),
  color        varchar(20),
  icon         varchar(50),
  is_active    boolean      NOT NULL DEFAULT true,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT accounts_user_name_unique UNIQUE (user_id, name)
);
-- Sin currency_code, sin initial_balance. Estructuralmente es casi un "categories".
```

### 3.3 `user_opening_balances` (apertura por moneda) — NUEVO

```sql
CREATE TABLE public.user_opening_balances (
  user_id       bigint      NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  currency_code varchar(10) NOT NULL REFERENCES public.currencies(code),
  amount        numeric     NOT NULL DEFAULT 0,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_opening_balances_pkey PRIMARY KEY (user_id, currency_code)
);
-- Plata inicial del pozo por moneda (reemplaza accounts.initial_balance).
```

### 3.4 `transactions` — moneda propia + cuenta opcional

```sql
CREATE TABLE public.transactions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       bigint      NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- Etiqueta/medio. Requerido en EXPENSE, NULL en INCOME (el ingreso es del usuario).
  account_id    uuid        REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_id   uuid        REFERENCES public.categories(id) ON DELETE SET NULL,
  group_id      uuid        REFERENCES public.transaction_groups(id) ON DELETE SET NULL,
  movement_type varchar(10) NOT NULL CHECK (movement_type IN ('EXPENSE','INCOME')),
  currency_code varchar(10) NOT NULL REFERENCES public.currencies(code),
  amount        numeric     NOT NULL CHECK (amount > 0),
  description   text,
  date          date        NOT NULL,
  created_at    timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at    timestamptz DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT transactions_expense_needs_account
    CHECK (movement_type = 'INCOME' OR account_id IS NOT NULL)
);
CREATE INDEX idx_tx_user_date     ON public.transactions(user_id, date DESC);
CREATE INDEX idx_tx_account       ON public.transactions(account_id);
CREATE INDEX idx_tx_category      ON public.transactions(category_id);
CREATE INDEX idx_tx_user_currency ON public.transactions(user_id, currency_code);
```

### 3.5 `exchanges` — cambio de moneda a nivel usuario (NUEVO, reemplaza transfers)

```sql
CREATE TABLE public.exchanges (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            bigint      NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  from_currency_code varchar(10) NOT NULL REFERENCES public.currencies(code),
  to_currency_code   varchar(10) NOT NULL REFERENCES public.currencies(code),
  from_amount        numeric     NOT NULL CHECK (from_amount > 0),
  to_amount          numeric     NOT NULL CHECK (to_amount > 0),
  exchange_rate      numeric     NOT NULL CHECK (exchange_rate > 0),  -- to_amount / from_amount
  description        text,
  date               date        NOT NULL,
  created_at         timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at         timestamptz DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT exchanges_diff_currency CHECK (from_currency_code <> to_currency_code)
);
-- NO existe tabla transfers. Mover plata "entre cuentas" deja de tener sentido.
```

### 3.6 `subscriptions` / `installments` (se conservan, cuenta como etiqueta)
- `subscriptions`: igual a v2 pero `account_id` es etiqueta **opcional**; `currency_code` en el
  plan. Cada `subscription_payment` crea un `EXPENSE` con esa moneda y esa etiqueta.
- `installments`: igual a v2 pero `account_id` etiqueta opcional; los pagos crean `EXPENSE`.
  **Se elimina la lógica de transfer en pagos adelantados** (`paying_account_id`, `transfer_id`):
  ya no hay cuenta-origen distinta que conciliar; el adelanto es solo un `EXPENSE` mayor.

### 3.7 `budget_items` (sin cambios)
- Hipotéticos para presupuesto mensual; `flow_type`, `currency_code`, refs opcionales a sub/installment.

### 3.8 Vistas

```sql
-- Saldo del pozo por moneda (héroe del dashboard)
CREATE VIEW public.v_user_balance_by_currency AS
SELECT c.user_id, c.currency_code,
  ( COALESCE(ob.amount,0)
    + COALESCE(inc.total,0) - COALESCE(exp.total,0)
    + COALESCE(xin.total,0) - COALESCE(xout.total,0) ) AS total_balance
FROM (SELECT DISTINCT user_id, currency_code FROM public.transactions
      UNION SELECT user_id, currency_code FROM public.user_opening_balances) c
LEFT JOIN public.user_opening_balances ob USING (user_id, currency_code)
LEFT JOIN (SELECT user_id, currency_code, SUM(amount) total FROM public.transactions
           WHERE movement_type='INCOME' GROUP BY 1,2) inc USING (user_id, currency_code)
LEFT JOIN (SELECT user_id, currency_code, SUM(amount) total FROM public.transactions
           WHERE movement_type='EXPENSE' GROUP BY 1,2) exp USING (user_id, currency_code)
LEFT JOIN (SELECT user_id, to_currency_code currency_code, SUM(to_amount) total
           FROM public.exchanges GROUP BY 1,2) xin USING (user_id, currency_code)
LEFT JOIN (SELECT user_id, from_currency_code currency_code, SUM(from_amount) total
           FROM public.exchanges GROUP BY 1,2) xout USING (user_id, currency_code);

-- Gasto por cuenta/medio (reemplaza el saldo por cuenta)
CREATE VIEW public.v_spending_by_account AS
SELECT user_id, account_id, currency_code, SUM(amount) AS total_expense
FROM public.transactions
WHERE movement_type='EXPENSE' AND account_id IS NOT NULL
GROUP BY user_id, account_id, currency_code;

-- v_installment_progress: igual a v2.
-- NO existe v_account_balance.
```

### 3.9 Diferencias clave vs schema v2
- ➖ `transfers`, `v_account_balance`, `accounts.currency_code`, `accounts.initial_balance`,
  `installment_advance_payments.paying_account_id` / `transfer_id`.
- ➕ `user_opening_balances`, `transactions.currency_code`, `exchanges`,
  `v_spending_by_account`, CHECK egreso-necesita-cuenta.

---

## 4. Backend (API)

Misma arquitectura que v2 (Express, `requireAuth`, `asyncHandler`, `HttpError`, todo
user-scoped). `db.js` con el fix de fechas de v2 (parser de `date` OID 1082 → string).

### 4.1 Endpoints
- **Auth:** `/auth/register|login|me` — igual a v2.
- **Catálogo:** `GET /currencies`, `GET/POST/PUT/DELETE /categories`, `GET /allowed-users`,
  `GET /exchange-rates`, `POST /exchange-rates/refresh`.
- **Cuentas/medios:** `GET/POST/PUT/DELETE /accounts` — solo etiquetas. **Borrar ya no se
  bloquea por movimientos** (las tx hacen `SET NULL`); opcionalmente confirmar.
- **Apertura:** `GET /opening-balances`, `PUT /opening-balances` (upsert por moneda).
- **Transacciones:** `GET /transactions` (filtros por tipo/cuenta/categoría/moneda/fecha,
  paginado), `POST`, `PUT`, `PATCH`, `DELETE`. Reglas:
  - `currency_code` requerido.
  - `EXPENSE` requiere `account_id`; `INCOME` lo ignora/permite NULL.
  - **Sin chequeo de saldo por cuenta.** Opcional: validar "no dejar el pozo de esa moneda
    en negativo" (configurable; por defecto **permitir negativo**, es solo un pozo).
- **Cambios de moneda:** `GET/POST/DELETE /exchanges` (calcula `exchange_rate`).
- **Suscripciones:** `/subscriptions` CRUD + `/subscription-payments` (crea `EXPENSE`).
- **Cuotas:** `/installments` CRUD + `/installment-payments` + `/installment-advance-payments`
  (este último **sin** transfer, solo `EXPENSE`).
- **Presupuesto:** `/budget/items` CRUD, `/budget/summary`, `/budget/settings`.
- **Dashboard/reportes:** `GET /dashboard/balance-by-currency`, `/dashboard/spending-by-account`,
  `/reports/category-breakdown`, `/reports/monthly-cashflow`, debts por sub/installment.

### 4.2 Qué se elimina respecto a v2
- ➖ Todo `/transfers`. El endpoint `/exchanges` se conserva pero **desacoplado de cuentas**.
- ➖ Guardas "la moneda de la cuenta debe coincidir" y "saldo suficiente por cuenta".
- ➖ Lógica de transfer interna en pagos adelantados.

### 4.3 Estructura modular del backend

Cada recurso es un **módulo** con sus capas (`routes → controller → service → schema`). Nada
de un `api.routes.js` gigante como en v2.

```
backend/
  src/
    server.js                 # arranque: listen + checkDatabaseConnection
    app.js                    # crea la app Express, CORS, monta middleware y el router /api
    config/
      env.js                  # carga y valida variables de entorno (falla rápido)
      db.js                   # cliente postgres (parser date OID 1082 -> string, fix de v2)
    middleware/
      require-auth.js         # JWT Bearer
      validate.js             # valida body/query con zod
      error-handler.js
      not-found.js
      request-context.js      # request id (x-request-id)
    utils/
      http-error.js
      async-handler.js
      exchange-rates.js       # snapshot FX (cache 5 min)
    modules/                  # un folder por recurso
      auth/         auth.routes.js · auth.controller.js · auth.service.js · auth.schema.js
      currencies/   currencies.routes.js · currencies.controller.js · currencies.service.js
      categories/   (routes · controller · service · schema)
      accounts/     (medios/etiquetas)
      opening-balances/
      transactions/
      exchanges/
      subscriptions/
      installments/
      budget/
      dashboard/
      reports/
    routes/
      index.js                # router raíz: monta cada modules/*/*.routes.js bajo /api
```

Convención por módulo:
- `*.routes.js` — define endpoints, aplica `requireAuth` + `validate(schema)`, delega al controller.
- `*.controller.js` — traduce HTTP ↔ servicio (lee `req`, responde `res.json`). Sin SQL.
- `*.service.js` — lógica de negocio + SQL de ese recurso. Sin objetos `req`/`res`.
- `*.schema.js` — esquemas zod de body/query.

Beneficio: cada archivo es chico y testeable; agregar un recurso = agregar una carpeta, sin
tocar un archivo central de 2.600 líneas.

---

## 5. Frontend

### 5.1 Sistema de diseño (tokens)

Lenguaje: **minimalismo editorial utilitario** (minimalist-skill) con identidad propia
(frontend-design). Para una app de finanzas, los **números en mono tabular** son el ancla.

**Color (warm monochrome + pastel semántico).** Paleta de 6 valores; un solo acento +
verde/rojo solo para signo de dinero:

| Rol | Hex (light) | Uso |
|---|---|---|
| Canvas | `#FBFBFA` | fondo app |
| Surface | `#FFFFFF` | cards |
| Border | `#EAEAEA` | divisores 1px (regla estricta) |
| Ink | `#1F2421` | texto principal (off-black) |
| Muted | `#787774` | texto secundario |
| Acento | `#2F6F4F` (verde profundo desaturado) | foco, selección, links |
| Ingreso | bg `#EDF3EC` / text `#346538` | signo + monto positivo |
| Egreso | bg `#FDEBEC` / text `#9F2F2D` | signo − monto negativo |

Dark mode obligatorio (off-black `#16181A`, surfaces `#1E2022`, mismos pastel atenuados).
Tokens vía CSS variables de shadcn (`--background`, `--foreground`, `--primary`, etc.) más
tokens propios `--income`, `--expense`. **Un solo acento en toda la app** (lock).

**Tipografía (pairing deliberado, NO Inter, NO lucide).**
- **Display (serif editorial):** `Newsreader` (decidido, D4) para títulos de sección y el balance
  héroe. Tracking `-0.02em`, line-height `1.1`. Se evitan `Fraunces` e `Instrument Serif`
  (marcadas como AI-default por taste-skill).
- **Body/UI (sans geométrica):** `Geist Sans` (o `Switzer`).
- **Números/meta (mono tabular):** `Geist Mono` con `font-variant-numeric: tabular-nums` —
  todos los montos, fechas y datos. Es el rasgo más característico.

**Forma y espacio.** Radius único `10px` (cards/inputs) y `6px` (botones) — *shape lock*.
Sin sombras pesadas (máx `0 1px 2px rgba(0,0,0,.04)`). Macro-whitespace: `py-10/py-16` entre
bloques. Sin gradientes, sin pills para contenedores grandes.

**Íconos.** `@phosphor-icons/react` (peso `regular`/`bold`), stroke uniforme. Nada de lucide.

**Motion (intensidad 3).** Solo: fade-in `translateY(8px)`/`opacity` en entrada de bloques
(IntersectionObserver), hover sutil en filas, `scale(0.98)` en `:active`. Respeta
`prefers-reduced-motion`. Sin scroll-hijack ni marquees (es un producto, no una landing).

### 5.2 shadcn/ui — setup e inventario

```bash
npm create vite@latest fffinanzas-v3-frontend -- --template react
npx shadcn@latest init        # base color neutral; luego se sobreescriben tokens
npx shadcn@latest add button card dialog dropdown-menu input select badge \
  table tabs sheet separator sonner chart form popover command skeleton \
  alert-dialog tooltip switch label scroll-area
```

> **Regla (taste/minimalist):** ningún componente shadcn queda en estado default. Se ajustan
> radius, color, tipografía y sombras a los tokens de 5.1. Se reemplazan los íconos lucide
> por Phosphor.

Mapeo de componentes:
- **Card** → tarjetas de balance, bento del dashboard.
- **Dialog / AlertDialog** → crear/editar transacción, exchange, gestión de categorías/medios.
- **Sheet** → nav drawer mobile (reemplaza el MobileNav manual de v2).
- **Tabs** → Movimientos (Ingresos / Egresos / Cambios).
- **Table** → listados de movimientos, cuotas, subs.
- **Select / Command / Popover** → selector de moneda, picker de cuenta/categoría.
- **Sonner** → toasts de create/update/delete/error (éxito 3s, error 6s — como v2 Item 8).
- **Chart** → cashflow, breakdown por categoría/cuenta.
- **Badge** → la "cuenta" como tag en cada egreso (el signature).
- **Skeleton** → estados de carga; **Empty states** redactados (frontend-design copy rules).

### 5.3 Estructura de la app (secciones)

Navegación (igual espíritu que v2, sidebar md+ / Sheet drawer < md):
`Dashboard · Movimientos · Cuotas · Subs/Fijos · Presupuesto · Ajustes`.
(No hay sección "Cuentas" como saldos; los medios se gestionan desde un modal, igual que
categorías. Las acciones viven en Movimientos, el dashboard es **solo data** — como decidimos
para v2 Item 7.)

**Dashboard (bento, signature).**
```
┌───────────────────────────────────────────────┐
│  SALDO TOTAL                                    │
│  ARS  1.284.300,00      USD  2.140,00          │  ← héroe: mono tabular grande, serif label
├──────────────────────┬────────────────────────┤
│  Cashflow (mensual)  │  Gasto por categoría    │
│  [area chart]        │  [bars / donut]         │
├──────────────────────┴────────────────────────┤
│  Gasto por cuenta/medio  (tags + montos)       │  ← reemplaza "saldo por cuenta"
├───────────────────────────────────────────────┤
│  Movimientos recientes (tabla compacta)        │
└───────────────────────────────────────────────┘
```

**Movimientos.** Dos botones **⬇ Ingreso** (verde) / **⬆ Gasto** (rojo) que abren un Dialog
controlado (patrón v2 Item 3). Form:
- Ingreso: monto + **moneda** + categoría (opc) + fecha + descripción. **Sin cuenta.**
- Gasto: monto + **moneda** + **cuenta/medio (requerido)** + categoría + fecha + descripción.
- Botón aparte **Cambio de moneda** → Dialog: de `from_amount/moneda` a `to_amount/moneda`
  (calcula y muestra el rate). No hay botón de "transferencia".
- Gestión de **categorías** y de **cuentas/medios** vía modales tipo manager (lista + input +
  guardar/cancelar + rename/delete), patrón v2 Item 2.

**Cuotas / Subs / Presupuesto.** Igual a v2 en funcionalidad; la "cuenta" del plan es una
etiqueta opcional. El pago genera un egreso con su moneda.

**Ajustes.** Apertura por moneda (`user_opening_balances`), gestión de medios y categorías, y
acción de **conteo/reconciliación** por moneda (desde el inicio, D3): el usuario ingresa cuánto
tiene realmente en una moneda y la app escribe un movimiento de ajuste (ingreso/egreso por la
diferencia, categoría "Ajuste") para cuadrar el pozo con la realidad.

### 5.4 Estado (Redux Toolkit + RTK Query)
A diferencia de v2 (un `financeSlice` monolítico con `loadFinanceData`), v3 usa **RTK Query**:
- Un **api-slice por recurso** (`transactionsApi`, `accountsApi`, `dashboardApi`, ...) sobre un
  `apiSlice` base con `baseQuery` que adjunta el token y normaliza errores.
- **Cache + invalidación por tags:** crear una transacción invalida `Transactions` y `Balance`,
  y las vistas se refrescan solas — sin re-fetch global.
- `uiSlice` (Redux normal) solo para estado de UI: sección activa + cola de toasts.
- Toast de éxito en `onQueryStarted`/al cumplirse la mutación; errores → toast (patrón v2 Item 8).

### 5.5 Estructura modular del frontend
Organización **feature-based**: cada feature co-localiza su api-slice y sus componentes.

```
frontend/
  src/
    main.jsx
    App.jsx                   # shell + auth gating + routing por sección
    app/
      store.js                # configureStore: api slices + uiSlice
      apiSlice.js             # createApi base (baseQuery: token + manejo de error + tags)
    lib/
      format.js               # formatCurrency, formatDate (con fix de fecha de v2)
      utils.js                # cn() para shadcn
    components/
      ui/                     # componentes shadcn (propios, customizados a los tokens 5.1)
      layout/                 # Sidebar, MobileNav (Sheet), Topbar, navItems.js
      common/                 # EmptyState, ConfirmDialog, MoneyAmount (mono tabular), ...
    features/
      auth/         authSlice.js · authApi.js · AuthPage.jsx
      dashboard/    dashboardApi.js · DashboardView.jsx · components/
      transactions/ transactionsApi.js · TransactionsView.jsx ·
                    components/{CreateTransactionDialog, CategoryManagerDialog, ...}
      accounts/     accountsApi.js · components/AccountManagerDialog.jsx
      exchanges/    exchangesApi.js · components/CreateExchangeDialog.jsx
      installments/ installmentsApi.js · InstallmentsView.jsx · components/
      subscriptions/ subscriptionsApi.js · SubscriptionsView.jsx · components/
      budget/       budgetApi.js · BudgetView.jsx · components/
      settings/     openingBalancesApi.js · SettingsView.jsx (apertura + reconciliación)
      ui/           uiSlice.js (toasts, sección activa)
    styles/
      globals.css             # tailwind + tokens (CSS variables de 5.1)
```

Beneficio: cada feature es autocontenida; sumar una pantalla = sumar una carpeta en `features/`.
Los componentes shadcn viven en `components/ui/` y se reusan desde las features.

---

## 6. Relación con v2 (qué se clona y qué cambia)

**Se reusa la lógica (re-modularizada):** auth (back y front), `db.js` (incl. fix de fechas),
lógica de cuotas en centavos, reportes FX-weighted a ARS, sistema de toasts, modales manager
de categorías, botones Ingreso/Gasto, nav responsive. *(La capa de datos del front pasa de
`financeSlice` monolítico a RTK Query por recurso; el back de `api.routes.js` a módulos.)*

**Se reescribe:** modelo de cuentas (etiquetas), transacciones (moneda propia + cuenta
condicional), se elimina transfers, exchanges pasa a nivel usuario, dashboard (balance único +
gasto por cuenta en vez de saldo por cuenta), capa visual completa a shadcn + tokens nuevos.

**Se elimina:** transferencias (UI, API, tabla, vista), chequeos de saldo por cuenta, lógica
de transfer en adelantos, una-cuenta-por-moneda.

---

## 7. Roadmap de implementación (fases)

1. **Scaffold backend** (clon de v2) + `schema-v3.sql` aplicado a una DB nueva.
2. **Auth + catálogos** (currencies, categories, accounts-etiqueta, opening-balances).
3. **Transacciones + exchanges** (con las reglas de moneda/cuenta) y vistas de balance.
4. **Scaffold frontend** Vite + shadcn init + tokens (5.1) + layout/nav.
5. **Dashboard** (balance único, cashflow, breakdowns, gasto por cuenta).
6. **Movimientos** (Ingreso/Gasto/Cambio + managers de categorías y medios).
7. **Cuotas / Subs / Presupuesto** (port simplificado de v2).
8. **Ajustes** (apertura + reconciliación) y pulido visual / dark mode / reduced-motion.
9. **Migración v2 → v3** (D5): ✅ `backend/scripts/migrate-v2-to-v3.js` (cross-DB, preserva UUIDs,
   apertura = Σ initial_balance por moneda, transfers cross-moneda → exchanges, valida pozos).
   Correr: `V2_DATABASE_URL=... V3_DATABASE_URL=... npm run migrate:v2-v3`.

---

## 8. Decisiones

- **D1 — Negativos:** ✅ **Resuelto: SÍ, permitir** que un pozo por moneda quede negativo. No
  hay chequeo de saldo bloqueante (ni por cuenta ni por pozo).
- **D2 — Cuenta en ingreso:** ✅ **Decidido: prohibida** (regla estricta). El ingreso es del
  usuario; si se permitiera cuenta en ingreso, volverían las transferencias.
- **D5 — Migración de datos de v2:** ✅ **Resuelto: migrar** los datos reales de v2.
  Mapeo: `apertura(moneda) = Σ accounts.initial_balance` por moneda · cada `transaction` hereda
  la moneda de su cuenta · `accounts` quedan como etiquetas (sin moneda/saldo) · transfers de
  **misma** moneda se descartan (eran neutrales) · transfers **cross-currency** → `exchanges` ·
  pagos adelantados pierden el transfer (quedan como `EXPENSE`). Se escribe un script de
  migración `v2 -> v3` y se valida que `Σ saldos v2 == Σ pozos v3` por moneda.

- **D3 — Reconciliación:** ✅ **Resuelto: desde el inicio.** La acción de conteo/ajuste por
  moneda va en *Ajustes* en la fase inicial (escribe un movimiento de ajuste para cuadrar el
  pozo con la realidad). *(no afecta el schema)*
- **D4 — Tipografía display:** ✅ **Resuelto: `Newsreader`** para la serif editorial (títulos +
  balance héroe). Descartadas `Fraunces` e `Instrument Serif` (AI-default según taste-skill).
