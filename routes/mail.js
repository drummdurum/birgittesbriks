const express = require('express');
const router = express.Router();
const { sendEmailResend } = require('../utils/resend');
require('dotenv').config();

// Simple admin check (keeps same behaviour as admin routes)
const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.isAdmin) {
    return res.status(401).json({ success: false, message: 'Adgang nægtet' });
  }
  next();
};

// POST /api/admin/mail
// Body: { to, subject, html?, text?, from? }
router.post('/', requireAdmin, async (req, res) => {
  const { to, subject, html, text, from } = req.body;

  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({ success: false, message: 'Feltet to, subject og html/text er påkrævet' });
  }

  try {
    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ success: false, message: 'RESEND_API_KEY ikke konfigureret på serveren' });
    }

    const result = await sendEmailResend({
      from: from || process.env.RESEND_FROM || process.env.FROM_EMAIL,
      to,
      subject,
      html,
      text
    });

    res.json({ success: true, result });
  } catch (err) {
    console.error('Error sending admin email via Resend:', err);
    res.status(500).json({ success: false, message: 'Fejl ved afsendelse af email', error: err.message });
  }
});

module.exports = router;
