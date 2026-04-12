
-- SCRIPT DEFINITIVO DE ESPELHAMENTO E PERMISSÕES MESTRE

-- 1. Substituir qualquer menção a 'master' por 'mestre' nas políticas existentes
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' AND (policyname ILIKE '%master%' OR definition ILIKE '%master%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. Garantir que o Mestre tem acesso total a todas as tabelas principais
-- Tabela: veiculos
DROP POLICY IF EXISTS "Mestre acesso total veiculos" ON public.veiculos;
CREATE POLICY "Mestre acesso total veiculos" ON public.veiculos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'mestre') OR auth.uid() = user_id)
WITH CHECK (public.has_role(auth.uid(), 'mestre') OR auth.uid() = user_id);

-- Tabela: mensalistas
DROP POLICY IF EXISTS "Mestre acesso total mensalistas" ON public.mensalistas;
CREATE POLICY "Mestre acesso total mensalistas" ON public.mensalistas FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'mestre') OR auth.uid() = user_id)
WITH CHECK (public.has_role(auth.uid(), 'mestre') OR auth.uid() = user_id);

-- Tabela: pagamentos
DROP POLICY IF EXISTS "Mestre acesso total pagamentos" ON public.pagamentos;
CREATE POLICY "Mestre acesso total pagamentos" ON public.pagamentos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'mestre') OR auth.uid() = user_id)
WITH CHECK (public.has_role(auth.uid(), 'mestre') OR auth.uid() = user_id);

-- Tabela: estacionamentos
DROP POLICY IF EXISTS "Mestre acesso total estacionamentos" ON public.estacionamentos;
CREATE POLICY "Mestre acesso total estacionamentos" ON public.estacionamentos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'mestre'))
WITH CHECK (public.has_role(auth.uid(), 'mestre'));

-- Tabela: user_roles
DROP POLICY IF EXISTS "Mestre gerencia roles" ON public.user_roles;
CREATE POLICY "Mestre gerencia roles" ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'mestre'))
WITH CHECK (public.has_role(auth.uid(), 'mestre'));

-- 3. Forçar a correção retroativa de estacionamento_id para o espelhamento funcionar
UPDATE public.veiculos v
SET estacionamento_id = e.id
FROM public.estacionamentos e
JOIN auth.users u ON e.email = u.email
WHERE v.user_id = u.id AND v.estacionamento_id IS NULL;

UPDATE public.mensalistas m
SET estacionamento_id = e.id
FROM public.estacionamentos e
JOIN auth.users u ON e.email = u.email
WHERE m.user_id = u.id AND m.estacionamento_id IS NULL;

UPDATE public.pagamentos p
SET estacionamento_id = e.id
FROM public.estacionamentos e
JOIN auth.users u ON e.email = u.email
WHERE p.user_id = u.id AND p.estacionamento_id IS NULL;
