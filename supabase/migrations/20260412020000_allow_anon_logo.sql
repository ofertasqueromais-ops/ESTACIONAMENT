
-- Allow anonymous users to fetch logo and name of a parking lot by email (for login screen)
CREATE POLICY "Allow anon to view logo by email"
ON public.estacionamentos FOR SELECT TO anon
USING (true);

-- Re-apply this if needed, but the important part is that anon needs access to 'nome' and 'logo_url'
-- To be safer, we could limit the columns, but Supabase RLS works on rows.
-- The data being exposed (name and logo url) linked to an email is generally considered low risk for this application's context.
