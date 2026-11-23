-- ==============================================================================
-- PARQUE NOVO MATO GROSSO — BANCO DO SITE (projeto parque-novo-mt, conta do parque)
-- Rodar no SQL Editor do Supabase. Pode rodar mais de uma vez sem estragar nada.
--
-- Regra de acesso:
--   * Qualquer visitante LÊ o conteúdo do site e as fotos.
--   * Só quem está na tabela site_admins (e logado) GRAVA conteúdo e sobe fotos.
--   * Visitantes só podem ENVIAR formulários e newsletter, nunca ler.
-- ==============================================================================

-- 0. Quem pode editar o site ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_admins (
  email TEXT PRIMARY KEY,
  nome TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.site_admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_site_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.site_admins
    WHERE lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
REVOKE ALL ON FUNCTION public.is_site_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_site_admin() TO anon, authenticated;

DROP POLICY IF EXISTS "Admin le a lista de admins" ON public.site_admins;
CREATE POLICY "Admin le a lista de admins"
  ON public.site_admins FOR SELECT
  TO authenticated
  USING (public.is_site_admin());

INSERT INTO public.site_admins (email, nome)
VALUES ('novomatogrossoparque@gmail.com', 'Conta do parque')
ON CONFLICT (email) DO NOTHING;

-- 1. Conteúdo do site (painel) --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_content (
  id TEXT PRIMARY KEY DEFAULT 'main',
  content JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Site Content" ON public.site_content;
CREATE POLICY "Public Read Site Content"
  ON public.site_content FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow Write Site Content" ON public.site_content;
DROP POLICY IF EXISTS "Authenticated Write Site Content" ON public.site_content;
DROP POLICY IF EXISTS "Admin Insert Site Content" ON public.site_content;
DROP POLICY IF EXISTS "Admin Update Site Content" ON public.site_content;
CREATE POLICY "Admin Insert Site Content"
  ON public.site_content FOR INSERT
  TO authenticated
  WITH CHECK (public.is_site_admin());
CREATE POLICY "Admin Update Site Content"
  ON public.site_content FOR UPDATE
  TO authenticated
  USING (public.is_site_admin())
  WITH CHECK (public.is_site_admin());

-- 2. Formulários ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind TEXT NOT NULL,
  fields JSONB NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'novo'
);
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Insert Form Submissions" ON public.form_submissions;
CREATE POLICY "Public Insert Form Submissions"
  ON public.form_submissions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Read Form Submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Admin Read Form Submissions" ON public.form_submissions;
CREATE POLICY "Admin Read Form Submissions"
  ON public.form_submissions FOR SELECT
  TO authenticated
  USING (public.is_site_admin());

-- 3. Newsletter -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome TEXT,
  email TEXT UNIQUE NOT NULL,
  interesse TEXT,
  origem TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Upsert Newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Public Insert Newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Public Insert Newsletter"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (email IS NOT NULL AND position('@' in email) > 1);

DROP POLICY IF EXISTS "Authenticated Read Newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admin Read Newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Admin Read Newsletter"
  ON public.newsletter_subscribers FOR SELECT
  TO authenticated
  USING (public.is_site_admin());

-- 4. Permissões das tabelas para a API ----------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_content TO authenticated;
GRANT SELECT ON public.site_admins TO authenticated;
GRANT INSERT ON public.form_submissions TO anon, authenticated;
GRANT SELECT ON public.form_submissions TO authenticated;
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT SELECT ON public.newsletter_subscribers TO authenticated;

-- 5. Fotos (Storage) ----------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('pnmt-media', 'pnmt-media', true, 10485760,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

DROP POLICY IF EXISTS "Public Media Read" ON storage.objects;
CREATE POLICY "Public Media Read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pnmt-media');

DROP POLICY IF EXISTS "Public Media Upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin Media Upload" ON storage.objects;
CREATE POLICY "Admin Media Upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'pnmt-media' AND public.is_site_admin());

DROP POLICY IF EXISTS "Public Media Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Media Update" ON storage.objects;
DROP POLICY IF EXISTS "Admin Media Update" ON storage.objects;
CREATE POLICY "Admin Media Update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'pnmt-media' AND public.is_site_admin());

DROP POLICY IF EXISTS "Authenticated Media Delete" ON storage.objects;
DROP POLICY IF EXISTS "Admin Media Delete" ON storage.objects;
CREATE POLICY "Admin Media Delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'pnmt-media' AND public.is_site_admin());
