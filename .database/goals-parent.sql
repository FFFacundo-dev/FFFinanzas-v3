-- ============================================================
-- METAS: agrupación padre/contenedor — FFFinanzas v3
-- ============================================================
-- Una meta puede AGRUPAR otras (ej: "Gastos Fijos" = "Impuesto 1" + "Impuesto 2" + ...).
-- El padre NO tiene movimientos propios: su monto/objetivo/progreso es la
-- SUMA de sus hijos (solo-lectura). Un solo nivel de anidación (un hijo no
-- puede a su vez ser padre). Los hijos comparten la moneda del padre.
--
-- ============================================================

ALTER TABLE public.goals
  ADD COLUMN parent_id uuid REFERENCES public.goals(id) ON DELETE SET NULL;

CREATE INDEX idx_goals_parent_id ON public.goals(parent_id);

-- v_goal_progress: para un padre, current_amount / target_amount / is_completed
-- se derivan de la suma de sus hijos. Para una meta normal u hoja, de sus propios
-- movimientos. parent_id se agrega al final (CREATE OR REPLACE exige no reordenar).
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
         SUM(c.target_amount)  AS target_amount
  FROM public.goals c
  JOIN own o ON o.id = c.id
  WHERE c.parent_id IS NOT NULL
  GROUP BY c.parent_id
)
SELECT
  g.id AS goal_id, g.user_id, g.name, g.currency_code,
  COALESCE(ca.target_amount, g.target_amount)   AS target_amount,
  g.deadline, g.status, g.created_at, g.updated_at,
  COALESCE(ca.current_amount, o.current_amount) AS current_amount,
  ( g.status <> 'ARCHIVED'
    AND COALESCE(ca.target_amount, g.target_amount) IS NOT NULL
    AND COALESCE(ca.current_amount, o.current_amount)
        >= COALESCE(ca.target_amount, g.target_amount) ) AS is_completed,
  g.parent_id
FROM public.goals g
JOIN own o ON o.id = g.id
LEFT JOIN child_agg ca ON ca.parent_id = g.id;
