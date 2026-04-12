
-- Add fields to estacionamentos table
ALTER TABLE public.estacionamentos 
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS endereco TEXT,
ADD COLUMN IF NOT EXISTS horario_funcionamento TEXT;

-- Add fields to veiculos table
ALTER TABLE public.veiculos 
ADD COLUMN IF NOT EXISTS marca TEXT,
ADD COLUMN IF NOT EXISTS modelo TEXT;
