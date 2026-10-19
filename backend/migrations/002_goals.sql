-- ============================================================
-- MÓDULO METAS (goals) — FFFinanzas v3
-- ============================================================
-- Una meta RESERVA (earmark) parte del pozo de una moneda, sin sacar la plata
-- del patrimonio (no es un EXPENSE). El monto de cada meta y lo reservado por
-- moneda se DERIVAN del ledger `goal_movements` (no se guardan saldos mutables),
-- igual que v_user_balance_by_currency se deriva de transactions.
--
-- Aplicar sobre el schema-v3 ya existente (usa public.set_updated_at,
-- public.users, public.currencies y public.v_user_balance_by_currency).
-- ============================================================

-- ------------------------------------------------------------
-- GOALS
-- ------------------------------------------------------------
CREATE TABLE public.goals (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       bigint       NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name          varchar(120) NOT NULL,
  -- Objetivo opcional (NULL = meta de ahorro abierto, sin objetivo).
  -- El CHECK admite NULL (NULL > 0 = NULL, que satisface el constraint).
  target_amount numeric      CHECK (target_amount > 0),
  currency_code varchar(10)  NOT NULL REFERENCES public.currencies(code),
  deadline      date,
  -- Estado controlado por el usuario. COMPLETED es DERIVADO (current >= target),
  -- no se guarda acá (ver v_goal_progress.is_completed).
  status        varchar(10)  NOT NULL DEFAULT 'ACTIVE'
                CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE TRIGGER trg_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ------------------------------------------------------------
-- GOAL MOVEMENTS (ledger de aportes/retiros de cada meta)
-- ------------------------------------------------------------
CREATE TABLE public.goal_movements (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id       uuid        NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id       bigint      NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  movement_type varchar(10) NOT NULL CHECK (movement_type IN ('ALLOCATE', 'RELEASE')),
  amount        numeric     NOT NULL CHECK (amount > 0),
  -- La fecha la setea el server (CURRENT_DATE); no es editable desde el cliente.
  date          date        NOT NULL DEFAULT CURRENT_DATE,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_goal_movements_goal_id ON public.goal_movements(goal_id);
CREATE INDEX idx_goal_movements_user_id ON public.goal_movements(user_id);
-- La moneda no se guarda acá: la hereda de goals.currency_code (meta mono-moneda).


-- ------------------------------------------------------------
-- VIEWS
-- ------------------------------------------------------------

-- Progreso por meta: monto actual (derivado) + flag COMPLETED derivado.
CREATE VIEW public.v_goal_progress AS
SELECT
  g.id AS goal_id, g.user_id, g.name, g.currency_code, g.target_amount,
  g.deadline, g.status, g.created_at, g.updated_at,
  COALESCE(SUM(CASE WHEN m.movement_type = 'ALLOCATE' THEN m.amount
                    WHEN m.movement_type = 'RELEASE'  THEN -m.amount END), 0) AS current_amount,
  ( g.status <> 'ARCHIVED'
    AND g.target_amount IS NOT NULL
    AND COALESCE(SUM(CASE WHEN m.movement_type = 'ALLOCATE' THEN m.amount
                          WHEN m.movement_type = 'RELEASE'  THEN -m.amount END), 0)
        >= g.target_amount ) AS is_completed
FROM public.goals g
LEFT JOIN public.goal_movements m ON m.goal_id = g.id
GROUP BY g.id;

-- Saldos bifurcados por (usuario, moneda): total / reservado / disponible.
-- Las metas ARCHIVED no reservan. available puede ser negativo (D1: pozo negativo).
CREATE VIEW public.v_user_balances_summary AS
SELECT
  b.user_id,
  b.currency_code,
  b.total_balance,
  COALESCE(r.reserved, 0)                   AS reserved_balance,
  b.total_balance - COALESCE(r.reserved, 0) AS available_balance
FROM public.v_user_balance_by_currency b
LEFT JOIN (
  SELECT g.user_id, g.currency_code,
         SUM(CASE WHEN m.movement_type = 'ALLOCATE' THEN m.amount ELSE -m.amount END) AS reserved
  FROM public.goals g
  JOIN public.goal_movements m ON m.goal_id = g.id
  WHERE g.status <> 'ARCHIVED'
  GROUP BY g.user_id, g.currency_code
) r ON r.user_id = b.user_id AND r.currency_code = b.currency_code;
