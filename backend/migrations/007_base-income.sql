-- Sueldo base (ingreso base): general por usuario + override opcional por presupuesto.
-- Aplicar UNA vez. Idempotente (IF NOT EXISTS). No borra datos.

BEGIN;

-- General: sueldo base por defecto del usuario (ARS). 0 = sin sueldo base.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS base_income numeric NOT NULL DEFAULT 0 CHECK (base_income >= 0);

-- Override por presupuesto: NULL = hereda el general del usuario.
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS base_income numeric CHECK (base_income >= 0);

COMMIT;
