import nodemailer from 'nodemailer';

// Recebe os formularios do site (contato, evento, visita, imprensa, newsletter)
// e envia cada um por e-mail para a caixa do parque, pela mesma conta Gmail usada no Trabalhe Conosco.
const DESTINO = process.env.FORM_DESTINO || 'novomatogrossoparque@gmail.com';
const TITULOS = {
  contato: 'Contato pelo site',
  evento: 'Pedido de evento pelo site',
  visita: 'Pedido de visita pelo site',
  imprensa: 'Pedido da imprensa pelo site',
  newsletter: 'Novo cadastro para receber novidades',
};
const esc = (s) => String(s ?? '').slice(0, 4000).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Metodo nao permitido' });
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return res.status(500).json({ ok: false, error: 'Envio nao configurado' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const kind = String(body.kind || 'contato').slice(0, 40);
    const fields = body.fields && typeof body.fields === 'object' ? body.fields : {};
    if (fields._gotcha_honey) return res.status(200).json({ ok: true });
    // A candidatura ja e enviada por /api/candidatura, com o curriculo anexo.
    if (kind === 'trabalhe-conosco') return res.status(200).json({ ok: true });
    const entries = Object.entries(fields).filter(([k, v]) => k !== '_gotcha_honey' && typeof v !== 'object').slice(0, 40);
    if (!entries.length) return res.status(400).json({ ok: false, error: 'Formulario vazio' });
    const nome = String(fields.nome || fields.name || 'Sem nome').slice(0, 120);
    const email = String(fields.email || '').trim();
    const rows = entries
      .map(([k, v]) => `<tr><td style="padding:6px 12px;background:#f1f5f9;font-weight:bold">${esc(k)}</td><td style="padding:6px 12px">${esc(v)}</td></tr>`)
      .join('');
    const titulo = TITULOS[kind] || 'Formulario do site';
    const html = `<h2 style="font-family:Arial;color:#0D2B4D">${esc(titulo)}</h2><table style="font-family:Arial;font-size:14px;border-collapse:collapse">${rows}</table><p style="font-family:Arial;font-size:12px;color:#64748b">Enviado pelo site parque-novo-mt em ${esc(new Date().toLocaleString('pt-BR', { timeZone: 'America/Cuiaba' }))}.</p>`;
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
    await transporter.sendMail({
      from: `"Site Parque Novo MT" <${user}>`,
      to: DESTINO,
      replyTo: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : undefined,
      subject: `${titulo}: ${nome}`,
      html,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[formulario]', err && err.message);
    return res.status(500).json({ ok: false, error: 'Falha no envio' });
  }
}
