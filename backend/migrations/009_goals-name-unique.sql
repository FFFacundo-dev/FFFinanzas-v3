-- Nombre de meta unico por usuario (case-insensitive, sin espacios al borde).
-- Hasta ahora esto lo validaba solo el service en JS, con una ventana de carrera
-- entre el SELECT y el INSERT. El indice lo cierra en la DB; el error 23505 ya
-- esta mapeado a 409 en error-handler.js.
CREATE UNIQUE INDEX IF NOT EXISTS goals_user_name_unique
  ON public.goals (user_id, lower(trim(name)));
