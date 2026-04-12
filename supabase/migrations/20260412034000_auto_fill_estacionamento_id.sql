
-- Função para preencher automaticamente o estacionamento_id baseado no e-mail do usuário
CREATE OR REPLACE FUNCTION public.set_estacionamento_id()
RETURNS TRIGGER AS $$
DECLARE
    target_est_id UUID;
BEGIN
    -- Busca o ID do estacionamento vinculado ao e-mail do usuário logado
    SELECT id INTO target_est_id 
    FROM public.estacionamentos 
    WHERE email = (SELECT email FROM auth.users WHERE id = NEW.user_id)
    LIMIT 1;

    IF NEW.estacionamento_id IS NULL THEN
        NEW.estacionamento_id := target_est_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gatilhos para garantir que novos registros sempre tenham o estacionamento_id
DROP TRIGGER IF EXISTS tr_set_est_id_veiculos ON public.veiculos;
CREATE TRIGGER tr_set_est_id_veiculos BEFORE INSERT ON public.veiculos FOR EACH ROW EXECUTE FUNCTION public.set_estacionamento_id();

DROP TRIGGER IF EXISTS tr_set_est_id_mensalistas ON public.mensalistas;
CREATE TRIGGER tr_set_est_id_mensalistas BEFORE INSERT ON public.mensalistas FOR EACH ROW EXECUTE FUNCTION public.set_estacionamento_id();

DROP TRIGGER IF EXISTS tr_set_est_id_pagamentos ON public.pagamentos;
CREATE TRIGGER tr_set_est_id_pagamentos BEFORE INSERT ON public.pagamentos FOR EACH ROW EXECUTE FUNCTION public.set_estacionamento_id();

-- Atualizar registros existentes que estão sem estacionamento_id
UPDATE public.veiculos v
SET estacionamento_id = (SELECT e.id FROM public.estacionamentos e JOIN auth.users u ON e.email = u.email WHERE u.id = v.user_id LIMIT 1)
WHERE estacionamento_id IS NULL;

UPDATE public.mensalistas m
SET estacionamento_id = (SELECT e.id FROM public.estacionamentos e JOIN auth.users u ON e.email = u.email WHERE u.id = m.user_id LIMIT 1)
WHERE estacionamento_id IS NULL;

UPDATE public.pagamentos p
SET estacionamento_id = (SELECT e.id FROM public.estacionamentos e JOIN auth.users u ON e.email = u.email WHERE u.id = p.user_id LIMIT 1)
WHERE estacionamento_id IS NULL;
