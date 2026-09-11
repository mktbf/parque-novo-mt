-- ==============================================================================
-- PARQUE NOVO MATO GROSSO — SUPABASE DATABASE & STORAGE SETUP (HARDENED SECURITY)
-- Execute este script no SQL Editor do seu projeto Supabase (Dashboard -> SQL Editor)
-- ==============================================================================

-- 1. Tabela para Conteúdo do Site (CMS)
CREATE TABLE IF NOT EXISTS public.site_content (
  id TEXT PRIMARY KEY DEFAULT 'main',
  content JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Permitir que qualquer visitante leia o conteúdo público do site
DROP POLICY IF EXISTS "Public Read Site Content" ON public.site_content;
CREATE POLICY "Public Read Site Content"
  ON public.site_content FOR SELECT
  USING (true);

-- Escrita restrita a usuários autenticados ou service_role (protege contra vandalismo público)
DROP POLICY IF EXISTS "Allow Write Site Content" ON public.site_content;
DROP POLICY IF EXISTS "Authenticated Write Site Content" ON public.site_content;
CREATE POLICY "Authenticated Write Site Content"
  ON public.site_content FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Tabela para Formulários de Contato, Visitas, Eventos e Trabalhe Conosco
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind TEXT NOT NULL,
  fields JSONB NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'novo'
);

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Visitantes podem apenas ENVIAR formulários (não podem consultar envios de terceiros)
DROP POLICY IF EXISTS "Public Insert Form Submissions" ON public.form_submissions;
CREATE POLICY "Public Insert Form Submissions"
  ON public.form_submissions FOR INSERT
  WITH CHECK (true);

-- Apenas administradores autenticados podem visualizar e gerenciar os envios (Conformidade LGPD)
DROP POLICY IF EXISTS "Authenticated Read Form Submissions" ON public.form_submissions;
CREATE POLICY "Authenticated Read Form Submissions"
  ON public.form_submissions FOR SELECT
  TO authenticated
  USING (true);

-- 3. Tabela para Assinantes da Newsletter
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome TEXT,
  email TEXT UNIQUE NOT NULL,
  interesse TEXT,
  origem TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Visitantes podem apenas se inscrever (inserir/atualizar o próprio e-mail)
-- Bloqueia expressamente SELECT para anônimos (impede scraping da lista de e-mails)
DROP POLICY IF EXISTS "Public Upsert Newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Public Insert Newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Public Insert Newsletter"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (email IS NOT NULL AND position('@' in email) > 1);

-- Apenas administradores autenticados podem ver a lista de assinantes (LGPD)
DROP POLICY IF EXISTS "Authenticated Read Newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Authenticated Read Newsletter"
  ON public.newsletter_subscribers FOR SELECT
  TO authenticated
  USING (true);

-- 4. Storage Bucket para Fotos e Mídia
-- Cria o bucket 'pnmt-media' caso não exista
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pnmt-media',
  'pnmt-media',
  true,
  10485760, -- 10 MB máximo por arquivo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Leitura pública de fotos e mídias
DROP POLICY IF EXISTS "Public Media Read" ON storage.objects;
CREATE POLICY "Public Media Read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pnmt-media');

-- Upload permitido para imagens legítimas
DROP POLICY IF EXISTS "Public Media Upload" ON storage.objects;
CREATE POLICY "Public Media Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pnmt-media' AND
    (LOWER(SUBSTRING(name FROM '\.([^\.]+)$')) IN ('jpg', 'jpeg', 'png', 'webp', 'gif'))
  );

-- Atualização e exclusão de mídia restrita a autenticados
DROP POLICY IF EXISTS "Public Media Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Media Update" ON storage.objects;
CREATE POLICY "Authenticated Media Update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'pnmt-media');

DROP POLICY IF EXISTS "Authenticated Media Delete" ON storage.objects;
CREATE POLICY "Authenticated Media Delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'pnmt-media');
