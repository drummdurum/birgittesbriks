const express = require('express');
const router = express.Router();
const { prisma } = require('../database/prisma');

// GET /api/availability?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date parameter required' });

    // Validate date format (ISO YYYY-MM-DD)
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    if (!iso.test(date)) return res.status(400).json({ error: 'Invalid date format, expected YYYY-MM-DD' });

    const targetDate = new Date(date);

    // Check blocked periods
    const blocked = await prisma.blockedDate.findFirst({
      where: {
        AND: [
          { start_date: { lte: targetDate } },
          { end_date: { gte: targetDate } }
        ]
      }
    });

    if (blocked) {
      return res.json({ blocked: true, reason: blocked.reason || null, bookedTimes: [] });
    }

    // Find booked times for that date (exclude cancelled)
    const bookings = await prisma.booking.findMany({
      where: {
        ønsket_dato: targetDate,
        NOT: { status: 'cancelled' }
      },
      select: { ønsket_tid: true }
    });

    const bookedTimes = bookings.map(b => b.ønsket_tid).filter(Boolean);

    res.json({ blocked: false, bookedTimes });
  } catch (err) {
    console.error('Error fetching availability:', err);
    res.status(500).json({ error: 'Fejl ved hentning af tilgængelighed' });
  }
});

module.exports = router;
