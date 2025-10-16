const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

// Middleware to check if user is authenticated as admin
const requireAdmin = (req, res, next) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ success: false, message: 'Adgang nægtet' });
    }
    next();
};

// Admin login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // For now, use environment variables for admin credentials
        // In production, these should be stored in database with hashed passwords
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'birgitte2025';
        
        if (username === adminUsername && password === adminPassword) {
            req.session.isAdmin = true;
            req.session.adminUser = { username };
            
            res.json({ 
                success: true, 
                user: { username } 
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Ugyldig brugernavn eller adgangskode' 
            });
        }
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server fejl' 
        });
    }
});

// Admin logout
router.post('/logout', (req, res) => {
    req.session.isAdmin = false;
    req.session.adminUser = null;
    res.json({ success: true });
});

// Check authentication status
router.get('/auth-status', (req, res) => {
    res.json({
        authenticated: !!req.session.isAdmin,
        user: req.session.adminUser || null
    });
});

// Get all bookings
router.get('/bookings', requireAdmin, async (req, res) => {
    try {
        const { pool } = require('../database/connection');
        const result = await pool.query(
            'SELECT * FROM bookings ORDER BY created_at DESC'
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Fejl ved hentning af bookinger' 
        });
    }
});

// Create manual booking
router.post('/bookings', requireAdmin, async (req, res) => {
    try {
        const { pool } = require('../database/connection');
        const {
            navn,
            telefon,
            email,
            ønsket_dato,
            ønsket_tid,
            behandling_type,
            besked,
            status = 'confirmed'
        } = req.body;
        
        // Validate required fields
        if (!navn || !telefon || !ønsket_dato || !ønsket_tid || !behandling_type) {
            return res.status(400).json({
                success: false,
                message: 'Alle påkrævede felter skal udfyldes'
            });
        }
        
        // Check for conflicts
        const conflictCheck = await pool.query(
            'SELECT id FROM bookings WHERE ønsket_dato = $1 AND ønsket_tid = $2 AND status != $3',
            [ønsket_dato, ønsket_tid, 'cancelled']
        );
        
        if (conflictCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Der er allerede en booking på dette tidspunkt'
            });
        }
        
        // Check if date is blocked
        const blockCheck = await pool.query(
            'SELECT id FROM blocked_dates WHERE $1 BETWEEN start_date AND COALESCE(end_date, start_date)',
            [ønsket_dato]
        );
        
        if (blockCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Denne dato er blokeret og kan ikke bookes'
            });
        }
        
        // Insert booking
        const result = await pool.query(`
            INSERT INTO bookings (
                navn, telefon, email, ønsket_dato, ønsket_tid, 
                behandling_type, besked, status, created_by_admin
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *
        `, [navn, telefon, email, ønsket_dato, ønsket_tid, behandling_type, besked, status, true]);
        
        res.json({
            success: true,
            booking: result.rows[0],
            message: 'Manuel booking oprettet succesfuldt'
        });
        
    } catch (error) {
        console.error('Error creating manual booking:', error);
        res.status(500).json({
            success: false,
            message: 'Fejl ved oprettelse af booking'
        });
    }
});

// Update booking status
router.put('/bookings/:id/status', requireAdmin, async (req, res) => {
    try {
        const { pool } = require('../database/connection');
        const { id } = req.params;
        const { status } = req.body;
        
        const result = await pool.query(
            'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking ikke fundet'
            });
        }
        
        res.json({
            success: true,
            booking: result.rows[0],
            message: `Booking ${status === 'confirmed' ? 'bekræftet' : 'annulleret'}`
        });
        
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({
            success: false,
            message: 'Fejl ved opdatering af booking'
        });
    }
});

// Get blocked dates
router.get('/blocked-dates', requireAdmin, async (req, res) => {
    try {
        const { pool } = require('../database/connection');
        const result = await pool.query(
            'SELECT * FROM blocked_dates ORDER BY start_date ASC'
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching blocked dates:', error);
        res.status(500).json({
            success: false,
            message: 'Fejl ved hentning af blokerede datoer'
        });
    }
});

// Block date/period
router.post('/blocked-dates', requireAdmin, async (req, res) => {
    try {
        const { pool } = require('../database/connection');
        const { startDate, endDate, reason } = req.body;
        
        if (!startDate) {
            return res.status(400).json({
                success: false,
                message: 'Startdato er påkrævet'
            });
        }
        
        // If no end date provided, use start date
        const finalEndDate = endDate || startDate;
        
        // Validate dates
        if (new Date(startDate) > new Date(finalEndDate)) {
            return res.status(400).json({
                success: false,
                message: 'Slutdato kan ikke være før startdato'
            });
        }
        
        // Check for existing bookings in the blocked period
        const existingBookings = await pool.query(`
            SELECT COUNT(*) as count FROM bookings 
            WHERE ønsket_dato BETWEEN $1 AND $2 
            AND status != 'cancelled'
        `, [startDate, finalEndDate]);
        
        if (existingBookings.rows[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: `Der er ${existingBookings.rows[0].count} eksisterende booking(er) i denne periode. Annuller dem først.`
            });
        }
        
        // Insert blocked period
        const result = await pool.query(`
            INSERT INTO blocked_dates (start_date, end_date, reason) 
            VALUES ($1, $2, $3) 
            RETURNING *
        `, [startDate, finalEndDate, reason]);
        
        res.json({
            success: true,
            blockedDate: result.rows[0],
            message: 'Periode blokeret succesfuldt'
        });
        
    } catch (error) {
        console.error('Error blocking date:', error);
        res.status(500).json({
            success: false,
            message: 'Fejl ved blokering af dato'
        });
    }
});

// Remove blocked date
router.delete('/blocked-dates/:id', requireAdmin, async (req, res) => {
    try {
        const { pool } = require('../database/connection');
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM blocked_dates WHERE id = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Blokeret periode ikke fundet'
            });
        }
        
        res.json({
            success: true,
            message: 'Blokeret periode fjernet succesfuldt'
        });
        
    } catch (error) {
        console.error('Error removing blocked date:', error);
        res.status(500).json({
            success: false,
            message: 'Fejl ved fjernelse af blokeret periode'
        });
    }
});

module.exports = router;