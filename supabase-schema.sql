-- ==============================================================================
-- PARQUE NOVO MATO GROSSO — SUPABASE DATABASE & STORAGE SETUP
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

-- Permitir escrita (insert / update)
DROP POLICY IF EXISTS "Allow Write Site Content" ON public.site_content;
CREATE POLICY "Allow Write Site Content"
  ON public.site_content FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Tabela para Formulários de Contato e Solicitações
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

DROP POLICY IF EXISTS "Public Upsert Newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Public Upsert Newsletter"
  ON public.newsletter_subscribers FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Storage Bucket para Fotos e Mídia
-- Cria o bucket 'pnmt-media' caso não exista
INSERT INTO storage.buckets (id, name, public)
VALUES ('pnmt-media', 'pnmt-media', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso público para o bucket de mídia
DROP POLICY IF EXISTS "Public Media Read" ON storage.objects;
CREATE POLICY "Public Media Read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pnmt-media');

DROP POLICY IF EXISTS "Public Media Upload" ON storage.objects;
CREATE POLICY "Public Media Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pnmt-media');

DROP POLICY IF EXISTS "Public Media Update" ON storage.objects;
CREATE POLICY "Public Media Update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'pnmt-media');

-- Pronto! O banco de dados e o bucket de storage estão configurados.
