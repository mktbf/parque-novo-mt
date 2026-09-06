/*
 * Supabase client for Parque Novo Mato Grosso
 * Loaded before app.js — exposes window.PNMT_SUPABASE
 *
 * Uses the official Supabase JS CDN (no npm needed for static site).
 * Configure SUPABASE_URL and SUPABASE_ANON_KEY below.
 */

(function () {
  'use strict';

  // =============================================
  // CONFIGURE THESE VALUES FROM YOUR SUPABASE PROJECT
  // Dashboard → Settings → API
  // =============================================
  const SUPABASE_URL = 'https://ojntiktsusdttlkefvnv.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_tiQEioVmgeSaP5Av1NiRdQ_LChECxEG';

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[PNMT] Supabase não configurado. Formulários em modo local.');
    return;
  }

  function initClient() {
    if (!window.supabase) return false;
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Expose endpoints for app.js form handler
    const config = window.PNMT_CONFIG;
    if (config) {
      config.formsEndpoint = '__supabase__';
      config.newsletterEndpoint = '__supabase__';
    }

    // Supabase submit functions
    window.PNMT_SUPABASE = {
      /**
       * Submit a form to form_submissions table
       * @param {Object} payload - {kind, submittedAt, fields}
       * @returns {Promise<{ok: boolean, error?: string}>}
       */
      async submitForm(payload) {
        const { error } = await client
          .from('form_submissions')
          .insert({
            kind: payload.kind,
            fields: payload.fields,
            submitted_at: payload.submittedAt,
          });

        if (error) {
          console.error('[PNMT] Erro ao enviar formulário:', error);
          return { ok: false, error: error.message };
        }
        return { ok: true };
      },

      /**
       * Subscribe to newsletter
       * @param {Object} payload - {kind, submittedAt, fields: {nome, email, interesse, origem}}
       * @returns {Promise<{ok: boolean, error?: string}>}
       */
      async submitNewsletter(payload) {
        const { nome, email, interesse, origem } = payload.fields;

        const { error } = await client
          .from('newsletter_subscribers')
          .upsert(
            { nome, email, interesse, origem },
            { onConflict: 'email' }
          );

        if (error) {
          console.error('[PNMT] Erro ao cadastrar newsletter:', error);
          return { ok: false, error: error.message };
        }
        return { ok: true };
      },
    };

    console.log('[PNMT] Supabase conectado.');
    return true;
  }

  // If already loaded via script tag
  if (initClient()) return;

  // Otherwise load Supabase client from CDN dynamically
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  script.onload = initClient;
  script.onerror = function () {
    console.warn('[PNMT] Falha ao carregar Supabase CDN. Formulários em modo local.');
  };
  document.head.appendChild(script);
})();
