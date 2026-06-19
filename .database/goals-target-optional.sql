-- ============================================================
-- Migración: target_amount opcional en metas
-- Correr sobre una DB que YA tiene goals.sql aplicado.
-- ============================================================

-- 1) Permitir objetivo nulo (el CHECK target_amount > 0 ya admite NULL).
ALTER TABLE public.goals ALTER COLUMN target_amount DROP NOT NULL;

-- 2) is_completed: una meta sin objetivo nunca se considera completada.
CREATE OR REPLACE VIEW public.v_goal_progress AS
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
