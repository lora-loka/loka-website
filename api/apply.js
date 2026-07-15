// Vercel serverless function — receives a careers application (resume file
// as base64 JSON) and emails it as an attachment via the Resend API.
//
// Required env var (set in the Vercel project settings):
//   RESEND_API_KEY   — your Resend API key
// Optional env vars:
//   APPLY_TO         — recipient (default: hello@loka.inc)
//   APPLY_FROM       — verified sender (default: Resend's onboarding sender,
//                      which only delivers to the Resend account owner until
//                      you verify a domain like loka.inc)
//
// The client posts JSON: { filename, contentBase64, contentType, email, role }
// base64 keeps the whole request under Vercel's ~4.5 MB body limit, so the
// client caps uploads at 3 MB (≈4 MB encoded).

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Email service is not configured yet.' });
  }

  // Read the raw request body ourselves so we don't depend on any platform
  // body-parser size default (base64 payloads can top 4 MB).
  let body = req.body;
  if (body == null || typeof body === 'string') {
    if (typeof body !== 'string') {
      body = await new Promise((resolve) => {
        let raw = '';
        req.on('data', (c) => { raw += c; });
        req.on('end', () => resolve(raw));
        req.on('error', () => resolve(''));
      });
    }
    try { body = JSON.parse(body || '{}'); } catch { body = {}; }
  }
  const { filename, contentBase64, contentType, email, role } = body || {};

  if (!filename || !contentBase64) {
    return res.status(400).json({ error: 'A resume file is required.' });
  }
  // Guard against oversized payloads slipping past the client cap.
  if (contentBase64.length > 6_000_000) {
    return res.status(413).json({ error: 'That file is too large — keep it under 3 MB.' });
  }

  const to = process.env.APPLY_TO || 'hello@loka.inc';
  const from = process.env.APPLY_FROM || 'Loka Careers <onboarding@resend.dev>';
  const roleName = role || 'Careers application';
  const applicant = email ? String(email).slice(0, 200) : '';

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject: `[Application] ${roleName}${applicant ? ' — ' + applicant : ''}`,
        ...(applicant ? { reply_to: applicant } : {}),
        html:
          `<p>New application for <strong>${escapeHtml(roleName)}</strong>.</p>` +
          `<p>Applicant email: ${applicant ? escapeHtml(applicant) : '(not provided)'}</p>` +
          `<p>Resume attached: ${escapeHtml(filename)}</p>`,
        attachments: [
          {
            filename: String(filename).slice(0, 200),
            content: contentBase64,
            ...(contentType ? { content_type: contentType } : {}),
          },
        ],
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      return res.status(502).json({ error: 'Email delivery failed.', detail: detail.slice(0, 500) });
    }
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Unexpected error.' });
  }
}
