
-- 1. Criar o bucket de logos (caso não exista)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de segurança para o bucket de logos
-- Permitir que qualquer pessoa veja as logos
DROP POLICY IF EXISTS "Logos are public" ON storage.objects;
CREATE POLICY "Logos are public" ON storage.objects FOR SELECT TO public USING (bucket_id = 'logos');

-- Permitir que usuários autenticados (Mestre) enviem imagens
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'logos');

-- Permitir que usuários autenticados (Mestre) atualizem/deletem
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
CREATE POLICY "Authenticated users can update logos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;
CREATE POLICY "Authenticated users can delete logos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'logos');


-- 3. Reforçar RLS para Multi-Tenancy (Permitir que o Mestre veja tudo)
DROP POLICY IF EXISTS "Mestre sees all veiculos" ON public.veiculos;
CREATE POLICY "Mestre sees all veiculos" ON public.veiculos FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'mestre') OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Mestre sees all mensalistas" ON public.mensalistas;
CREATE POLICY "Mestre sees all mensalistas" ON public.mensalistas FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'mestre') OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Mestre sees all pagamentos" ON public.pagamentos;
CREATE POLICY "Mestre sees all pagamentos" ON public.pagamentos FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'mestre') OR auth.uid() = user_id);
