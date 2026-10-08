import nodemailer from 'nodemailer';

const MAX_BYTES = 3 * 1024 * 1024;
const EXT_OK = ['pdf', 'doc', 'docx'];
const esc = (s) => String(s ?? '').slice(0, 4000).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Metodo nao permitido' });
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return res.status(500).json({ ok: false, error: 'Envio nao configurado' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const fields = body.fields && typeof body.fields === 'object' ? body.fields : {};
    if (fields._gotcha_honey) return res.status(200).json({ ok: true });
    const attachments = [];
    if (body.cv && body.cv.data) {
      const name = String(body.cv.name || 'curriculo').slice(0, 120);
      const ext = name.split('.').pop().toLowerCase();
      if (!EXT_OK.includes(ext)) return res.status(400).json({ ok: false, error: 'Formato de arquivo nao aceito' });
      const buf = Buffer.from(String(body.cv.data), 'base64');
      if (buf.length > MAX_BYTES) return res.status(400).json({ ok: false, error: 'Arquivo maior que 3 MB' });
      attachments.push({ filename: name, content: buf });
    }
    const nome = String(fields.nome || fields.name || 'Candidato').slice(0, 120);
    const vaga = String(fields.vaga_interesse || 'Banco de talentos').slice(0, 120);
    const emailCand = String(fields.email || '').trim();
    const rows = Object.entries(fields)
      .filter(([k]) => k !== '_gotcha_honey')
      .map(([k, v]) => `<tr><td style="padding:6px 12px;background:#f1f5f9;font-weight:bold">${esc(k)}</td><td style="padding:6px 12px">${esc(v)}</td></tr>`)
      .join('');
    const html = `<h2 style="font-family:Arial;color:#0D2B4D">Nova candidatura pelo site</h2><table style="font-family:Arial;font-size:14px;border-collapse:collapse">${rows}</table><p style="font-family:Arial;font-size:13px;color:#6B6B6B">${attachments.length ? 'Curriculo em anexo.' : 'Sem anexo. Veja o link do LinkedIn acima.'}</p>`;
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
    await transporter.sendMail({
      from: `"Site Parque Novo MT" <${user}>`,
      to: 'rh@parquenovomt.com',
      replyTo: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailCand) ? emailCand : undefined,
      subject: `Candidatura: ${vaga} - ${nome}`,
      html,
      attachments,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[candidatura]', err && err.message);
    return res.status(500).json({ ok: false, error: 'Falha no envio' });
  }
}
