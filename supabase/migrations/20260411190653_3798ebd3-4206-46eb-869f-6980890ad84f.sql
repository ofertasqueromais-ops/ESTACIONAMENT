
-- Create mensalistas table
CREATE TABLE public.mensalistas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  placa TEXT NOT NULL,
  telefone TEXT,
  valor_mensal NUMERIC NOT NULL DEFAULT 0,
  vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'vencido')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mensalistas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own mensalistas" ON public.mensalistas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create veiculos table
CREATE TABLE public.veiculos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  placa TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'carro' CHECK (tipo IN ('carro', 'moto')),
  entrada TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  saida TIMESTAMP WITH TIME ZONE,
  valor NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'finalizado')),
  mensalista BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own veiculos" ON public.veiculos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create pagamentos table
CREATE TABLE public.pagamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  veiculo_id UUID NOT NULL REFERENCES public.veiculos(id) ON DELETE CASCADE,
  valor NUMERIC NOT NULL DEFAULT 0,
  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao')),
  data TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pagamentos" ON public.pagamentos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_veiculos_placa ON public.veiculos(placa);
CREATE INDEX idx_veiculos_status ON public.veiculos(status);
CREATE INDEX idx_mensalistas_placa ON public.mensalistas(placa);
CREATE INDEX idx_pagamentos_data ON public.pagamentos(data);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_mensalistas_updated_at
  BEFORE UPDATE ON public.mensalistas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
