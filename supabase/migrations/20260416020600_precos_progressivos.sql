-- Add columns for progressive pricing table
ALTER TABLE public.estacionamentos
ADD COLUMN IF NOT EXISTS valor_15_min numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_30_min numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_60_min numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_hora_adicional numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS tipo_cobranca text DEFAULT 'fixo';
