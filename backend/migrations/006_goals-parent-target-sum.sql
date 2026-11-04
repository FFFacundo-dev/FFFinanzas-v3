-- ============================================================
-- FIX metas padre: objetivo = SIEMPRE suma de hijas — FFFinanzas v3
-- ============================================================
-- Antes SUM(target_amount) ignoraba los NULL, así que un padre con 2 hijas
-- donde solo 1 tenía objetivo "tomaba" el objetivo de esa hija. Ahora el padre
-- queda sin objetivo (NULL) si alguna hija no lo tiene. Correr una vez.
-- ============================================================

CREATE OR REPLACE VIEW public.v_goal_progress AS
WITH own AS (
  SELECT g.id,
    COALESCE(SUM(CASE WHEN m.movement_type = 'ALLOCATE' THEN m.amount
                      WHEN m.movement_type = 'RELEASE'  THEN -m.amount END), 0) AS current_amount
  FROM public.goals g
  LEFT JOIN public.goal_movements m ON m.goal_id = g.id
  GROUP BY g.id
),
child_agg AS (
  SELECT c.parent_id,
         SUM(o.current_amount) AS current_amount,
         CASE WHEN bool_or(c.target_amount IS NULL) THEN NULL
              ELSE SUM(c.target_amount) END AS target_amount
  FROM public.goals c
  JOIN own o ON o.id = c.id
  WHERE c.parent_id IS NOT NULL
  GROUP BY c.parent_id
)
SELECT
  g.id AS goal_id, g.user_id, g.name, g.currency_code,
  CASE WHEN ca.parent_id IS NOT NULL THEN ca.target_amount ELSE g.target_amount END AS target_amount,
  g.deadline, g.status, g.created_at, g.updated_at,
  COALESCE(ca.current_amount, o.current_amount) AS current_amount,
  ( g.status <> 'ARCHIVED'
    AND (CASE WHEN ca.parent_id IS NOT NULL THEN ca.target_amount ELSE g.target_amount END) IS NOT NULL
    AND COALESCE(ca.current_amount, o.current_amount)
        >= (CASE WHEN ca.parent_id IS NOT NULL THEN ca.target_amount ELSE g.target_amount END) ) AS is_completed,
  g.parent_id
FROM public.goals g
JOIN own o ON o.id = g.id
LEFT JOIN child_agg ca ON ca.parent_id = g.id;
