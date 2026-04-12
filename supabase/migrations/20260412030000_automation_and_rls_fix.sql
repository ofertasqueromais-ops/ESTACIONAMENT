
-- Função que será executada automaticamente toda vez que um usuário for criado no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o e-mail do novo usuário estiver na lista de estacionamentos cadastrados
  IF EXISTS (SELECT 1 FROM public.estacionamentos WHERE email = NEW.email) THEN
    -- Damos a ele o cargo de 'admin' automaticamente na tabela user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ativa o gatilho (trigger) na tabela de usuários do Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Também garantir que o Mestre sempre consiga ver tudo através das políticas RLS
-- (Re-aplicando para ter certeza que está correto)
DROP POLICY IF EXISTS "Mestre and owners can view estacionamentos" ON public.estacionamentos;
CREATE POLICY "Mestre and owners can view estacionamentos"
ON public.estacionamentos FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'mestre') OR 
  (auth.jwt() ->> 'email' = email)
);
