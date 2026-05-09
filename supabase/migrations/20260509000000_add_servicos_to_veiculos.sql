-- Migration to add servicos column to veiculos table
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS servicos JSONB DEFAULT '[]'::jsonb;
