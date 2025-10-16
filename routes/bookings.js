const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { pool } = require('../database/connection');
const { sendBookingConfirmation, sendBookingNotification } = require('../utils/email');

const router = express.Router();

// Rate limiting for booking requests
const bookingLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 3, // limit each IP to 3 requests per windowMs
  message: {
    error: 'For mange booking-forespørgsler. Prøv igen senere.',
    retryAfter: '15 minutter'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation rules for booking
const bookingValidation = [
  body('navn')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Navn skal være mellem 2 og 100 tegn')
    .matches(/^[a-zA-ZæøåÆØÅ\s-]+$/)
    .withMessage('Navn må kun indeholde bogstaver, mellemrum og bindestreger'),
    
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Indtast en gyldig email adresse'),
    
  body('telefon')
    .trim()
    .matches(/^[\d\s+()-]+$/)
    .isLength({ min: 8, max: 20 })
    .withMessage('Indtast et gyldigt telefonnummer'),
    
  body('ønsket_dato')
    .optional()
    .isISO8601()
    .withMessage('Indtast en gyldig dato'),
    
  body('ønsket_tid')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Tidspunkt må maks være 20 tegn'),
    
  body('behandling_type')
    .optional()
    .isIn(['Enkelt behandling', '3 behandlinger (klippekort)', '10 behandlinger (klippekort)'])
    .withMessage('Vælg en gyldig behandlingstype'),
    
  body('besked')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Besked må maks være 1000 tegn'),
    
  body('gdpr_samtykke')
    .equals('true')
    .withMessage('Du skal acceptere behandling af persondata')
];

// GET /api/bookings - Get all bookings (for admin)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, navn, email, telefon, ønsket_dato, ønsket_tid, behandling_type, besked, status, created_at FROM bookings ORDER BY created_at DESC'
    );
    
    res.json({
      success: true,
      bookings: result.rows
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({
      error: 'Der opstod en fejl ved hentning af bookinger'
    });
  }
});

// POST /api/bookings - Create new booking
router.post('/', bookingLimiter, bookingValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Ugyldige data',
        details: errors.array()
      });
    }

    const {
      navn,
      email,
      telefon,
      ønsket_dato,
      ønsket_tid,
      behandling_type = 'Enkelt behandling',
      besked,
      gdpr_samtykke
    } = req.body;

    // Insert booking into database
    const result = await pool.query(
      `INSERT INTO bookings 
       (navn, email, telefon, ønsket_dato, ønsket_tid, behandling_type, besked, gdpr_samtykke) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, created_at`,
      [navn, email, telefon, ønsket_dato, ønsket_tid, behandling_type, besked, gdpr_samtykke]
    );

    const booking = result.rows[0];

    // Send emails
    try {
      await Promise.all([
        sendBookingConfirmation({
          navn,
          email,
          telefon,
          ønsket_dato,
          ønsket_tid,
          behandling_type,
          besked,
          bookingId: booking.id
        }),
        sendBookingNotification({
          navn,
          email,
          telefon,
          ønsket_dato,
          ønsket_tid,
          behandling_type,
          besked,
          bookingId: booking.id,
          created_at: booking.created_at
        })
      ]);
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail the booking if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Din booking er modtaget! Du vil høre fra os snarest.',
      bookingId: booking.id
    });

  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({
      error: 'Der opstod en fejl ved oprettelse af booking. Prøv igen eller ring på 21 85 34 17.'
    });
  }
});

// PUT /api/bookings/:id/status - Update booking status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        error: 'Ugyldig status'
      });
    }

    const result = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Booking ikke fundet'
      });
    }

    res.json({
      success: true,
      booking: result.rows[0]
    });

  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({
      error: 'Der opstod en fejl ved opdatering af booking'
    });
  }
});

module.exports = router;