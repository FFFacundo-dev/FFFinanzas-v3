-- Corrección 2: presupuestos con nombre (varios por mes).
-- Aplicar UNA vez. No borra datos: los items existentes quedan bajo un
-- presupuesto por defecto "Presupuesto" (is_default) por cada (user_id, period_month).
-- Idempotente en lo posible (IF NOT EXISTS / WHERE budget_id IS NULL).

BEGIN;

CREATE TABLE IF NOT EXISTS public.budgets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     bigint NOT NULL,
  name        text   NOT NULL,
  period_month date  NOT NULL,
  is_default  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS budgets_user_month_idx ON public.budgets (user_id, period_month);

-- Como mucho un default por (user, mes).
CREATE UNIQUE INDEX IF NOT EXISTS budgets_one_default_per_month
  ON public.budgets (user_id, period_month) WHERE is_default;

ALTER TABLE public.budget_items
  ADD COLUMN IF NOT EXISTS budget_id uuid REFERENCES public.budgets(id) ON DELETE CASCADE;

-- 1) un budget default por cada (user_id, period_month) que tenga items sin budget.
INSERT INTO public.budgets (user_id, period_month, name, is_default)
SELECT DISTINCT bi.user_id, bi.period_month, 'Presupuesto', true
FROM public.budget_items bi
WHERE bi.budget_id IS NULL;

-- 2) backfill: enganchar cada item con el default de su (user, mes).
UPDATE public.budget_items bi
SET budget_id = b.id
FROM public.budgets b
WHERE bi.budget_id IS NULL
  AND b.user_id = bi.user_id
  AND b.period_month = bi.period_month
  AND b.is_default;

-- 3) ahora sí: obligatorio.
ALTER TABLE public.budget_items ALTER COLUMN budget_id SET NOT NULL;

COMMIT;
