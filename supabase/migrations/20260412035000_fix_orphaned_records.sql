
-- SCRIPT DE CORREÇÃO FINAL PARA VISIBILIDADE DO MESTRE

-- 1. Vincular veículos órfãos ao estacionamento correto baseado no e-mail do usuário criador
UPDATE public.veiculos v
SET estacionamento_id = e.id
FROM public.estacionamentos e
JOIN auth.users u ON e.email = u.email
WHERE v.user_id = u.id AND v.estacionamento_id IS NULL;

-- 2. Vincular mensalistas órfãos
UPDATE public.mensalistas m
SET estacionamento_id = e.id
FROM public.estacionamentos e
JOIN auth.users u ON e.email = u.email
WHERE m.user_id = u.id AND m.estacionamento_id IS NULL;

-- 3. Vincular pagamentos órfãos
UPDATE public.pagamentos p
SET estacionamento_id = e.id
FROM public.estacionamentos e
JOIN auth.users u ON e.email = u.email
WHERE p.user_id = u.id AND p.estacionamento_id IS NULL;

-- 4. Reforçar o gatilho automático para garantir que falhas no frontend sejam corrigidas pelo banco
CREATE OR REPLACE FUNCTION public.set_estacionamento_id_fallback()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estacionamento_id IS NULL THEN
        SELECT id INTO NEW.estacionamento_id 
        FROM public.estacionamentos 
        WHERE email = (SELECT email FROM auth.users WHERE id = NEW.user_id)
        LIMIT 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_set_est_id_veiculos ON public.veiculos;
CREATE TRIGGER tr_set_est_id_veiculos BEFORE INSERT ON public.veiculos FOR EACH ROW EXECUTE FUNCTION public.set_estacionamento_id_fallback();

DROP TRIGGER IF EXISTS tr_set_est_id_mensalistas ON public.mensalistas;
CREATE TRIGGER tr_set_est_id_mensalistas BEFORE INSERT ON public.mensalistas FOR EACH ROW EXECUTE FUNCTION public.set_estacionamento_id_fallback();

DROP TRIGGER IF EXISTS tr_set_est_id_pagamentos ON public.pagamentos;
CREATE TRIGGER tr_set_est_id_pagamentos BEFORE INSERT ON public.pagamentos FOR EACH ROW EXECUTE FUNCTION public.set_estacionamento_id_fallback();
