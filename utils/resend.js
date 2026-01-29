require('dotenv').config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY ikke sat - Resend klient deaktiveret');
}

async function sendEmailResend({ from, to, subject, html, text }) {
  if (!RESEND_API_KEY) throw new Error('Resend API key not configured');

  const payload = {
    from,
    to,
    subject
  };

  if (html) payload.html = html;
  if (text) payload.text = text;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }

  return res.json();
}

module.exports = {
  sendEmailResend
};
