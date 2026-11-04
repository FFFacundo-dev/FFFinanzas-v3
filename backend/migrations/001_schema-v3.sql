-- ============================================================
-- SCHEMA - FFFinanzas v3 (modelo de "fondo unico")
-- Auth: propia (no Supabase Auth) · DB: PostgreSQL (Supabase)
-- ============================================================
-- La plata es un unico pozo por moneda del usuario:
--   saldo(moneda) = apertura + ingresos - egresos + exchange_in - exchange_out
-- Las "cuentas" (accounts) son etiquetas/medios de pago, sin saldo ni moneda.
-- El ingreso se asocia al usuario (sin cuenta); el egreso indica de que cuenta sale.
-- No existen transferencias; el unico movimiento entre monedas es el cambio (exchanges).
-- Ver PLAN.md para el diseno completo.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ------------------------------------------------------------
-- TRIGGER updated_at (reutilizable)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- USERS & ACCESS CONTROL
-- ============================================================
CREATE TABLE public.users (
  id                 bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email              citext      NOT NULL UNIQUE,
  password_hash      text        NOT NULL,
  preferred_language varchar(10) NOT NULL DEFAULT 'es',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.allowed_users (
  id         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email      citext      NOT NULL UNIQUE,
  full_name  text,
  is_active  boolean     NOT NULL DEFAULT true,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_allowed_users_updated_at
  BEFORE UPDATE ON public.allowed_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- CURRENCIES (catalogo fijo)
-- ============================================================
CREATE TABLE public.currencies (
  code      varchar(10) PRIMARY KEY,
  name      text        NOT NULL,
  symbol    varchar(10) NOT NULL,
  is_active boolean     NOT NULL DEFAULT true
);

INSERT INTO public.currencies (code, name, symbol) VALUES
  ('ARS', 'Peso Argentino',       '$'),
  ('USD', 'Dolar Estadounidense', 'U$D'),
  ('EUR', 'Euro',                 '€'),
  ('BRL', 'Real Brasileno',       'R$'),
  ('UYU', 'Peso Uruguayo',        '$U');


-- ============================================================
-- CATEGORIES (por usuario)
-- ============================================================
CREATE TABLE public.categories (
  id         uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    bigint       NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name       varchar(100) NOT NULL,
  created_at timestamptz  DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz  DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT categories_user_name_unique UNIQUE (user_id, name)
);
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- ACCOUNTS (medios de pago / etiquetas, SIN saldo ni moneda)
-- ============================================================
CREATE TABLE public.accounts (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      bigint       NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name         varchar(100) NOT NULL,
  account_type varchar(10)  NOT NULL CHECK (account_type IN ('BANK', 'DIGITAL', 'CASH')),
  color        varchar(20),
  icon         varchar(50),
  is_active    boolean      NOT NULL DEFAULT true,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT accounts_user_name_unique UNIQUE (user_id, name)
);
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE TRIGGER trg_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- USER OPENING BALANCES (apertura del pozo por moneda)
-- ============================================================
CREATE TABLE public.user_opening_balances (
  user_id       bigint      NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  currency_code varchar(10) NOT NULL REFERENCES public.currencies(code),
  amount        numeric     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_opening_balances_pkey PRIMARY KEY (user_id, currency_code)
);
CREATE TRIGGER trg_user_opening_balances_updated_at
  BEFORE UPDATE ON public.user_opening_balances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- TRANSACTION GROUPS (agrupacion semantica opcional)
-- ============================================================
CREATE TABLE public.transaction_groups (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     bigint      NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_transaction_groups_user_id ON public.transaction_groups(user_id);
CREATE TRIGGER trg_transaction_groups_updated_at
  BEFORE UPDATE ON public.transaction_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- TRANSACTIONS
-- La moneda vive en la fila. account_id es la etiqueta/medio:
-- requerido en EXPENSE, NULL en INCOME (el ingreso es del usuario).
-- ============================================================
CREATE TABLE public.transactions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       bigint      NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id    uuid        REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_id   uuid        REFERENCES public.categories(id) ON DELETE SET NULL,
  group_id      uuid        REFERENCES public.transaction_groups(id) ON DELETE SET NULL,
  movement_type varchar(10) NOT NULL CHECK (movement_type IN ('EXPENSE', 'INCOME')),
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
CREATE INDEX idx_tx_group         ON public.transactions(group_id);
CREATE INDEX idx_tx_user_currency ON public.transactions(user_id, currency_code);
CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- EXCHANGES (cambio de moneda a nivel usuario; reemplaza transfers)
-- ============================================================
CREATE TABLE public.exchanges (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            bigint      NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  from_currency_code varchar(10) NOT NULL REFERENCES public.currencies(code),
  to_currency_code   varchar(10) NOT NULL REFERENCES public.currencies(code),
  from_amount        numeric     NOT NULL CHECK (from_amount > 0),
  to_amount          numeric     NOT NULL CHECK (to_amount > 0),
  exchange_rate      numeric     NOT NULL CHECK (exchange_rate > 0),
  description        text,
  date               date        NOT NULL,
  created_at         timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at         timestamptz DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT exchanges_diff_currency CHECK (from_currency_code <> to_currency_code)
);
CREATE INDEX idx_exchanges_user_date ON public.exchanges(user_id, date DESC);
CREATE TRIGGER trg_exchanges_updated_at
  BEFORE UPDATE ON public.exchanges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- SUBSCRIPTIONS (recurrentes sin fin). account_id = etiqueta opcional.
-- ============================================================
CREATE TABLE public.subscriptions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        bigint      NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id    uuid        REFERENCES public.categories(id) ON DELETE SET NULL,
  name           text        NOT NULL,
  description    text,
  currency_code  varchar(10) NOT NULL DEFAULT 'ARS' REFERENCES public.currencies(code),
  default_amount numeric     CHECK (default_amount IS NULL OR default_amount > 0),
  account_id     uuid        REFERENCES public.accounts(id) ON DELETE SET NULL,
  billing_day    integer     CHECK (billing_day IS NULL OR billing_day BETWEEN 0 AND 31),
  start_date     date,
  status         varchar(10) NOT NULL DEFAULT 'ACTIVE'
                   CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELLED')),
  created_at     timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at     timestamptz DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_subscriptions_user_id_status ON public.subscriptions(user_id, status);
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.subscription_payments (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid        NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id         bigint      NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id      uuid        REFERENCES public.accounts(id) ON DELETE SET NULL,
  amount          numeric     NOT NULL CHECK (amount > 0),
  payment_date    date        NOT NULL,
  period_month    date        NOT NULL,
  transaction_id  uuid        REFERENCES public.transactions(id) ON DELETE SET NULL,
  notes           text,
  created_at      timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at      timestamptz DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT subscription_payments_unique_period UNIQUE (subscription_id, period_month)
);
CREATE INDEX idx_sub_payments_subscription_id ON public.subscription_payments(subscription_id);
CREATE INDEX idx_sub_payments_user_id_date    ON public.subscription_payments(user_id, payment_date DESC);
CREATE TRIGGER trg_subscription_payments_updated_at
  BEFORE UPDATE ON public.subscription_payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- INSTALLMENTS (cuotas). account_id = etiqueta opcional.
-- Montos en centavos a nivel app; la ultima cuota absorbe el redondeo.
-- ============================================================
CREATE TABLE public.installments (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   bigint      NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id                uuid        REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_id               uuid        REFERENCES public.categories(id) ON DELETE SET NULL,
  description               text        NOT NULL,
  currency_code             varchar(10) NOT NULL DEFAULT 'ARS' REFERENCES public.currencies(code),
  total_amount              numeric     NOT NULL CHECK (total_amount > 0),
  total_installments        integer     NOT NULL CHECK (total_installments > 0),
  default_amount            numeric     NOT NULL CHECK (default_amount > 0),
  billing_day               integer     CHECK (billing_day IS NULL OR billing_day BETWEEN 0 AND 31),
  start_date                date        NOT NULL,
  paid_installments_initial integer     NOT NULL DEFAULT 0 CHECK (paid_installments_initial >= 0),
  status                    varchar(10) NOT NULL DEFAULT 'ACTIVE'
                              CHECK (status IN ('ACTIVE', 'FINISHED', 'CANCELLED')),
  created_at                timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at                timestamptz DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT installments_initial_not_exceed_total
    CHECK (paid_installments_initial < total_installments)
);
CREATE INDEX idx_installments_user_id_status ON public.installments(user_id, status);
CREATE INDEX idx_installments_account_id     ON public.installments(account_id);
CREATE TRIGGER trg_installments_updated_at
  BEFORE UPDATE ON public.installments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.installment_payments (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  installment_id     uuid        NOT NULL REFERENCES public.installments(id) ON DELETE CASCADE,
  user_id            bigint      NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  installment_number integer     NOT NULL CHECK (installment_number > 0),
  amount_override    numeric     CHECK (amount_override IS NULL OR amount_override > 0),
  payment_date       date        NOT NULL,
  transaction_id     uuid        REFERENCES public.transactions(id) ON DELETE SET NULL,
  notes              text,
  created_at         timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at         timestamptz DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT installment_payments_unique_number UNIQUE (installment_id, installment_number)
);
CREATE INDEX idx_inst_payments_installment_id ON public.installment_payments(installment_id);
CREATE INDEX idx_inst_payments_user_id_date   ON public.installment_payments(user_id, payment_date DESC);
CREATE TRIGGER trg_installment_payments_updated_at
  BEFORE UPDATE ON public.installment_payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Pagos adelantados: cubren N cuotas consecutivas desde un mes dado.
-- (Sin paying_account_id / transfer_id: en fondo unico no hay transferencias.)
CREATE TABLE public.installment_advance_payments (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  installment_id     uuid        NOT NULL REFERENCES public.installments(id) ON DELETE CASCADE,
  user_id            bigint      NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  installments_count integer     NOT NULL CHECK (installments_count > 0),
  total_amount       numeric     NOT NULL CHECK (total_amount > 0),
  payment_date       date        NOT NULL,
  applies_from_month date        NOT NULL,
  transaction_id     uuid        REFERENCES public.transactions(id) ON DELETE SET NULL,
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_adv_payments_installment_id ON public.installment_advance_payments(installment_id);
CREATE INDEX idx_adv_payments_user_id        ON public.installment_advance_payments(user_id);
CREATE TRIGGER trg_installment_advance_payments_updated_at
  BEFORE UPDATE ON public.installment_advance_payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- BUDGET ITEMS (hipoteticos; no afectan saldos reales)
-- ============================================================
CREATE TABLE public.budget_items (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         bigint      NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  period_month    date        NOT NULL,
  label           text        NOT NULL,
  amount          numeric     NOT NULL CHECK (amount > 0),
  flow_type       varchar(10) NOT NULL DEFAULT 'EXPENSE' CHECK (flow_type IN ('EXPENSE', 'INCOME')),
  currency_code   varchar(10) NOT NULL DEFAULT 'ARS' REFERENCES public.currencies(code),
  item_type       varchar(15) NOT NULL CHECK (item_type IN ('SUBSCRIPTION', 'ONE_TIME', 'INSTALLMENT')),
  subscription_id uuid        REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  installment_id  uuid        REFERENCES public.installments(id)  ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT budget_items_single_ref CHECK (subscription_id IS NULL OR installment_id IS NULL),
  CONSTRAINT budget_items_income_shape_check CHECK (
    flow_type = 'EXPENSE'
    OR (flow_type = 'INCOME' AND item_type = 'ONE_TIME'
        AND subscription_id IS NULL AND installment_id IS NULL)
  )
);
CREATE INDEX idx_budget_items_user_id_period ON public.budget_items(user_id, period_month);
CREATE TRIGGER trg_budget_items_updated_at
  BEFORE UPDATE ON public.budget_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Excedente manual por (usuario, mes, moneda)
CREATE TABLE public.budget_settings (
  user_id      bigint      NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  period_month date        NOT NULL,
  currency_code varchar(10) NOT NULL REFERENCES public.currencies(code),
  surplus      numeric     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT budget_settings_pkey PRIMARY KEY (user_id, period_month, currency_code)
);
CREATE TRIGGER trg_budget_settings_updated_at
  BEFORE UPDATE ON public.budget_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- VIEWS
-- ============================================================

-- Saldo del pozo por (usuario, moneda)
CREATE VIEW public.v_user_balance_by_currency AS
SELECT
  c.user_id,
  c.currency_code,
  ( COALESCE(ob.amount, 0)
    + COALESCE(inc.total, 0)  - COALESCE(exp.total, 0)
    + COALESCE(xin.total, 0)  - COALESCE(xout.total, 0) ) AS total_balance
FROM (
  SELECT user_id, currency_code FROM public.transactions
  UNION SELECT user_id, currency_code FROM public.user_opening_balances
  UNION SELECT user_id, from_currency_code FROM public.exchanges
  UNION SELECT user_id, to_currency_code   FROM public.exchanges
) c
LEFT JOIN public.user_opening_balances ob
  ON ob.user_id = c.user_id AND ob.currency_code = c.currency_code
LEFT JOIN (
  SELECT user_id, currency_code, SUM(amount) AS total
  FROM public.transactions WHERE movement_type = 'INCOME'
  GROUP BY user_id, currency_code
) inc ON inc.user_id = c.user_id AND inc.currency_code = c.currency_code
LEFT JOIN (
  SELECT user_id, currency_code, SUM(amount) AS total
  FROM public.transactions WHERE movement_type = 'EXPENSE'
  GROUP BY user_id, currency_code
) exp ON exp.user_id = c.user_id AND exp.currency_code = c.currency_code
LEFT JOIN (
  SELECT user_id, to_currency_code AS currency_code, SUM(to_amount) AS total
  FROM public.exchanges GROUP BY user_id, to_currency_code
) xin ON xin.user_id = c.user_id AND xin.currency_code = c.currency_code
LEFT JOIN (
  SELECT user_id, from_currency_code AS currency_code, SUM(from_amount) AS total
  FROM public.exchanges GROUP BY user_id, from_currency_code
) xout ON xout.user_id = c.user_id AND xout.currency_code = c.currency_code;

-- Gasto por (usuario, cuenta/medio, moneda) -- reemplaza el saldo por cuenta
CREATE VIEW public.v_spending_by_account AS
SELECT user_id, account_id, currency_code, SUM(amount) AS total_expense
FROM public.transactions
WHERE movement_type = 'EXPENSE' AND account_id IS NOT NULL
GROUP BY user_id, account_id, currency_code;

-- Progreso de cuotas por installment
CREATE VIEW public.v_installment_progress AS
SELECT
  i.id                              AS installment_id,
  i.user_id,
  i.description,
  i.total_installments,
  i.paid_installments_initial,
  i.status,
  COALESCE(p.paid_count, 0)         AS paid_via_payments,
  COALESCE(a.advance_count, 0)      AS paid_via_advances,
  ( i.paid_installments_initial + COALESCE(p.paid_count, 0) + COALESCE(a.advance_count, 0) ) AS total_paid,
  GREATEST(0,
    i.total_installments - i.paid_installments_initial
    - COALESCE(p.paid_count, 0) - COALESCE(a.advance_count, 0)
  )                                 AS remaining
FROM public.installments i
LEFT JOIN (
  SELECT installment_id, COUNT(*) AS paid_count
  FROM public.installment_payments GROUP BY installment_id
) p ON p.installment_id = i.id
LEFT JOIN (
  SELECT installment_id, SUM(installments_count) AS advance_count
  FROM public.installment_advance_payments GROUP BY installment_id
) a ON a.installment_id = i.id;
