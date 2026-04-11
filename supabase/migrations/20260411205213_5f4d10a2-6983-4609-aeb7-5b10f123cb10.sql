
-- Create estacionamentos table
CREATE TABLE public.estacionamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  logo_url TEXT,
  responsavel TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.estacionamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master manages all estacionamentos"
ON public.estacionamentos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'master'))
WITH CHECK (public.has_role(auth.uid(), 'master'));

CREATE POLICY "Users can view own estacionamento"
ON public.estacionamentos FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() AND u.email = estacionamentos.email
  )
);

CREATE TRIGGER update_estacionamentos_updated_at
BEFORE UPDATE ON public.estacionamentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add estacionamento_id to existing tables
ALTER TABLE public.veiculos ADD COLUMN estacionamento_id UUID REFERENCES public.estacionamentos(id);
ALTER TABLE public.mensalistas ADD COLUMN estacionamento_id UUID REFERENCES public.estacionamentos(id);
ALTER TABLE public.pagamentos ADD COLUMN estacionamento_id UUID REFERENCES public.estacionamentos(id);

-- Update RLS policies
DROP POLICY IF EXISTS "Users manage own veiculos" ON public.veiculos;
CREATE POLICY "Users manage own veiculos" ON public.veiculos FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'master'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'master'));

DROP POLICY IF EXISTS "Users manage own mensalistas" ON public.mensalistas;
CREATE POLICY "Users manage own mensalistas" ON public.mensalistas FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'master'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'master'));

DROP POLICY IF EXISTS "Users manage own pagamentos" ON public.pagamentos;
CREATE POLICY "Users manage own pagamentos" ON public.pagamentos FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'master'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'master'));

CREATE POLICY "Master manages all roles" ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'master'))
WITH CHECK (public.has_role(auth.uid(), 'master'));
