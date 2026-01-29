const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { sendBookingConfirmation } = require('../utils/email');

// Rate limit: max 5 confirmation emails per hour per IP
const confirmationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    error: 'For mange email-forespørgsler fra denne IP. Prøv igen senere.'
  }
});

// POST /api/mail/confirmation
router.post('/confirmation', confirmationLimiter, [
  body('email').isEmail().withMessage('Ugyldig email'),
  body('navn').trim().isLength({ min: 2 }).withMessage('Navn skal være mindst 2 tegn')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Ugyldige data', details: errors.array() });
    }

    const { navn, email, telefon, ønsket_dato, ønsket_tid, behandling_type, besked } = req.body;

    await sendBookingConfirmation({
      navn,
      email,
      telefon: telefon || '',
      ønsket_dato: ønsket_dato || null,
      ønsket_tid: ønsket_tid || null,
      behandling_type: behandling_type || 'Enkelt behandling',
      besked: besked || null,
      bookingId: 'test' // indicate this is a test/preview email
    });

    res.json({ success: true, message: 'Bekræftelsesmail sendt (test)' });
  } catch (err) {
    console.error('Error sending confirmation email (public):', err);
    res.status(500).json({ success: false, error: 'Kunne ikke sende email. Prøv igen senere.' });
  }
});

module.exports = router;
