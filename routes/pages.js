const express = require('express');
const path = require('path');

const router = express.Router();

// Home page
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Booking page
router.get('/booking', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'booking.html'));
});

// Booking confirmation (uses booking page)
router.get('/booking-confirmation', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'booking.html'));
});

// Admin page
router.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

module.exports = router;
