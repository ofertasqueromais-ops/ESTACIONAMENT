
-- Add 'mestre' to app_role enum if it doesn't exist
-- We use a DO block because ALTER TYPE ADD VALUE cannot be executed inside a transaction block in some cases,
-- but since this is a migration, we check for existence first.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'mestre') THEN
        ALTER TYPE public.app_role ADD VALUE 'mestre';
    END IF;
END $$;

-- Update RLS policies to include 'mestre'
-- Policies for 'estacionamentos'
DROP POLICY IF EXISTS "Master manages all estacionamentos" ON public.estacionamentos;
CREATE POLICY "Mestre manages all estacionamentos"
ON public.estacionamentos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'mestre') OR public.has_role(auth.uid(), 'master'))
WITH CHECK (public.has_role(auth.uid(), 'mestre') OR public.has_role(auth.uid(), 'master'));

-- Policies for 'veiculos'
DROP POLICY IF EXISTS "Users manage own veiculos" ON public.veiculos;
CREATE POLICY "Users manage own veiculos" ON public.veiculos FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'mestre') OR public.has_role(auth.uid(), 'master'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'mestre') OR public.has_role(auth.uid(), 'master'));

-- Policies for 'mensalistas'
DROP POLICY IF EXISTS "Users manage own mensalistas" ON public.mensalistas;
CREATE POLICY "Users manage own mensalistas" ON public.mensalistas FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'mestre') OR public.has_role(auth.uid(), 'master'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'mestre') OR public.has_role(auth.uid(), 'master'));

-- Policies for 'pagamentos'
DROP POLICY IF EXISTS "Users manage own pagamentos" ON public.pagamentos;
CREATE POLICY "Users manage own pagamentos" ON public.pagamentos FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'mestre') OR public.has_role(auth.uid(), 'master'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'mestre') OR public.has_role(auth.uid(), 'master'));

-- Policies for 'user_roles'
DROP POLICY IF EXISTS "Master manages all roles" ON public.user_roles;
CREATE POLICY "Mestre manages all roles" ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'mestre') OR public.has_role(auth.uid(), 'master'))
WITH CHECK (public.has_role(auth.uid(), 'mestre') OR public.has_role(auth.uid(), 'master'));
