-- =============================================
-- Parque Novo Mato Grosso — Supabase Schema
-- Tabelas para formulários do site
-- =============================================

-- 1. Solicitações de formulários (visita, evento, imprensa, contato)
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('visita', 'evento', 'imprensa', 'contato')),
  fields JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'lido', 'respondido', 'arquivado')),
  notes TEXT
);

-- 2. Newsletter / cadastro de interesse
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  interesse TEXT NOT NULL DEFAULT 'Todos',
  origem TEXT,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (email)
);

-- Índices para consultas frequentes
CREATE INDEX idx_submissions_kind ON form_submissions (kind);
CREATE INDEX idx_submissions_status ON form_submissions (status);
CREATE INDEX idx_submissions_created ON form_submissions (created_at DESC);
CREATE INDEX idx_newsletter_email ON newsletter_subscribers (email);
CREATE INDEX idx_newsletter_active ON newsletter_subscribers (active) WHERE active = TRUE;

-- RLS (Row Level Security) — Público pode inserir, apenas autenticados leem
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Permitir INSERT anônimo (visitantes do site)
CREATE POLICY "Visitantes podem enviar formulários"
  ON form_submissions FOR INSERT
  TO anon
  WITH CHECK (TRUE);

CREATE POLICY "Visitantes podem se inscrever na newsletter"
  ON newsletter_subscribers FOR INSERT
  TO anon
  WITH CHECK (TRUE);

-- Apenas usuários autenticados (admin) podem ler/atualizar
CREATE POLICY "Admins podem ler formulários"
  ON form_submissions FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins podem atualizar status"
  ON form_submissions FOR UPDATE
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Admins podem ler newsletter"
  ON newsletter_subscribers FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins podem atualizar newsletter"
  ON newsletter_subscribers FOR UPDATE
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);
