-- Categoria de sistema "Ingreso": siempre presente en cada usuario, no se borra ni
-- se renombra. Solo los movimientos INCOME con esta categoria cuentan como ingreso
-- real en reportes; el resto (devoluciones, etc.) siguen sumando al pozo igual.
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;

-- Una sola categoria de sistema por usuario.
CREATE UNIQUE INDEX IF NOT EXISTS categories_user_system_unique
  ON public.categories (user_id) WHERE is_system;

-- Si el usuario ya tenia una "Ingreso" (sin importar mayusculas), se adopta esa.
UPDATE public.categories c SET is_system = true, name = 'Ingreso'
WHERE lower(trim(c.name)) = 'ingreso'
  AND NOT EXISTS (SELECT 1 FROM public.categories s WHERE s.user_id = c.user_id AND s.is_system)
  AND c.id = (SELECT min(x.id::text)::uuid FROM public.categories x
              WHERE x.user_id = c.user_id AND lower(trim(x.name)) = 'ingreso');

INSERT INTO public.categories (user_id, name, is_system)
SELECT u.id, 'Ingreso', true FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.user_id = u.id AND c.is_system);

-- Usuarios nuevos nacen con su categoria "Ingreso".
CREATE OR REPLACE FUNCTION public.create_system_categories()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, is_system) VALUES (NEW.id, 'Ingreso', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_system_categories ON public.users;
CREATE TRIGGER trg_users_system_categories
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.create_system_categories();
