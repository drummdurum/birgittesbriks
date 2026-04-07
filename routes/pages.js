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

// About page
router.get('/om', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'om.html'));
});

// Booking confirmation (uses booking page)
router.get('/booking-confirmation', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'booking.html'));
});

// Privacy policy page
router.get('/privatliv', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'privatliv.html'));
});

// Admin page
router.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

// Admin subsection pages (all use shared admin UI)
router.get('/admin/bookings', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

router.get('/admin/blocked', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

router.get('/admin/manual', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

router.get('/admin/import', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

router.get('/admin/cancelled', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

router.get('/admin/completed', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

module.exports = router;
