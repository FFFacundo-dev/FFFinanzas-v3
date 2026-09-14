-- Ajustes de un gasto fijo (suscripción/cuota) dentro de UN presupuesto puntual.
-- Sin fila = incluido y con su monto real. La fila nunca toca el monto original:
-- subscriptions/installments.default_amount queda intacto para pagos y reportes.
-- Aplicar UNA vez. Idempotente. No borra datos.

BEGIN;

-- Versión previa de este mismo feature, nunca llegó a usarse.
DROP TABLE IF EXISTS public.budget_fixed_exclusions;

CREATE TABLE IF NOT EXISTS public.budget_fixed_overrides (
  budget_id uuid    NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  source_id uuid    NOT NULL,                 -- id de la suscripción o de la cuota
  included  boolean NOT NULL DEFAULT true,    -- false = no cuenta en este presupuesto
  amount    numeric CHECK (amount > 0),       -- NULL = usar el monto real
  PRIMARY KEY (budget_id, source_id)
);

COMMIT;
