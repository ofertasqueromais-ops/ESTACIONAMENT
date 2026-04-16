
ALTER TABLE public.estacionamentos
  ADD COLUMN intervalo_cobranca text NOT NULL DEFAULT '1hora',
  ADD COLUMN tolerancia_minutos integer NOT NULL DEFAULT 5,
  ADD COLUMN valor_hora numeric NOT NULL DEFAULT 4,
  ADD COLUMN valor_maximo numeric NOT NULL DEFAULT 20;
