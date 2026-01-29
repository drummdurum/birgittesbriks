const express = require('express');
const bcrypt = require('bcrypt');
const { prisma } = require('../database/prisma');
const { sendBookingFinalConfirmation } = require('../utils/email');
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
        const bookings = await prisma.booking.findMany({
            orderBy: { created_at: 'desc' }
        });
        
        // Ensure we're returning a proper array
        if (!Array.isArray(bookings)) {
            console.warn('Warning: bookings response is not an array:', typeof bookings);
            return res.json([]);
        }
        
        // Convert Date objects to ISO strings for JSON serialization
        const serializedBookings = bookings.map(booking => ({
            ...booking,
            ønsket_dato: booking.ønsket_dato ? new Date(booking.ønsket_dato).toISOString().split('T')[0] : null,
            created_at: booking.created_at ? booking.created_at.toISOString() : null,
            updated_at: booking.updated_at ? booking.updated_at.toISOString() : null
        }));
        
        res.json(serializedBookings);
    } catch (error) {
        console.error('Error fetching bookings - Details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        res.status(500).json({ 
            success: false, 
            message: 'Fejl ved hentning af bookinger',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Create manual booking
router.post('/bookings', requireAdmin, async (req, res) => {
    try {
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
        const conflictCheck = await prisma.booking.findFirst({
            where: {
                ønsket_dato: new Date(ønsket_dato),
                ønsket_tid,
                NOT: { status: 'cancelled' }
            }
        });
        
        if (conflictCheck) {
            return res.status(400).json({
                success: false,
                message: 'Der er allerede en booking på dette tidspunkt'
            });
        }
        
        // Check if date is blocked
        const blockCheck = await prisma.blockedDate.findFirst({
            where: {
                AND: [
                    { start_date: { lte: new Date(ønsket_dato) } },
                    { end_date: { gte: new Date(ønsket_dato) } }
                ]
            }
        });
        
        if (blockCheck) {
            return res.status(400).json({
                success: false,
                message: 'Denne dato er blokeret og kan ikke bookes'
            });
        }
        
        // Insert booking
        const booking = await prisma.booking.create({
            data: {
                navn,
                telefon,
                email: email || null,
                ønsket_dato: new Date(ønsket_dato),
                ønsket_tid,
                behandling_type,
                besked: besked || null,
                status,
                created_by_admin: true
            }
        });
        
        // Convert Date objects to ISO strings
        const serializedBooking = {
            ...booking,
            ønsket_dato: booking.ønsket_dato ? new Date(booking.ønsket_dato).toISOString().split('T')[0] : null,
            created_at: booking.created_at ? booking.created_at.toISOString() : null,
            updated_at: booking.updated_at ? booking.updated_at.toISOString() : null
        };
        
        res.json({
            success: true,
            booking: serializedBooking,
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
        const { id } = req.params;
        const { status } = req.body;
        
        const updateData = { status };
        if (status === 'completed') updateData.completed = true;

        const booking = await prisma.booking.update({
            where: { id: parseInt(id) },
            data: updateData
        });
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking ikke fundet'
            });
        }
        
        // Convert Date objects to ISO strings
            const serializedBooking = {
            ...booking,
            ønsket_dato: booking.ønsket_dato ? new Date(booking.ønsket_dato).toISOString().split('T')[0] : null,
            created_at: booking.created_at ? booking.created_at.toISOString() : null,
            updated_at: booking.updated_at ? booking.updated_at.toISOString() : null
        };

        // If booking was just confirmed, send final confirmation email to customer (do not fail on email errors)
        if (status === 'confirmed') {
            (async () => {
                try {
                    await sendBookingFinalConfirmation({
                        navn: serializedBooking.navn,
                        email: serializedBooking.email,
                        telefon: serializedBooking.telefon,
                        ønsket_dato: serializedBooking.ønsket_dato,
                        ønsket_tid: serializedBooking.ønsket_tid,
                        behandling_type: serializedBooking.behandling_type,
                        besked: serializedBooking.besked,
                        bookingId: serializedBooking.id
                    });
                } catch (emailErr) {
                    console.error('Error sending final confirmation email:', emailErr);
                }
            })();
        }

        res.json({
            success: true,
            booking: serializedBooking,
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

// Trigger sending final confirmation email for a booking (admin)
router.post('/bookings/:id/send-final', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await prisma.booking.findUnique({ where: { id: parseInt(id) } });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking ikke fundet' });
        }

        if (!booking.email) {
            return res.status(400).json({ success: false, message: 'Booking har ingen email' });
        }

        // Send email and return result (failures reported)
        try {
            await sendBookingFinalConfirmation({
                navn: booking.navn,
                email: booking.email,
                telefon: booking.telefon,
                ønsket_dato: booking.ønsket_dato ? new Date(booking.ønsket_dato).toISOString().split('T')[0] : null,
                ønsket_tid: booking.ønsket_tid,
                behandling_type: booking.behandling_type,
                besked: booking.besked,
                bookingId: booking.id
            });

            return res.json({ success: true, message: 'Bekræftelsesmail sendt' });
        } catch (emailErr) {
            console.error('Error sending final confirmation email (admin send):', emailErr);
            return res.status(500).json({ success: false, message: 'Fejl ved afsendelse af bekræftelsesmail', error: emailErr.message });
        }

    } catch (error) {
        console.error('Error in send-final route:', error);
        res.status(500).json({ success: false, message: 'Serverfejl' });
    }
});

// Get blocked dates
router.get('/blocked-dates', requireAdmin, async (req, res) => {
    try {
        const blockedDates = await prisma.blockedDate.findMany({
            orderBy: { start_date: 'asc' }
        });
        
        // Ensure we're returning a proper array
        if (!Array.isArray(blockedDates)) {
            console.warn('Warning: blockedDates response is not an array:', typeof blockedDates);
            return res.json([]);
        }
        
        // Convert Date objects to ISO strings for JSON serialization
        const serializedBlockedDates = blockedDates.map(blocked => ({
            ...blocked,
            start_date: blocked.start_date ? new Date(blocked.start_date).toISOString().split('T')[0] : null,
            end_date: blocked.end_date ? new Date(blocked.end_date).toISOString().split('T')[0] : null,
            created_at: blocked.created_at ? blocked.created_at.toISOString() : null
        }));
        
        res.json(serializedBlockedDates);
    } catch (error) {
        console.error('Error fetching blocked dates - Details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        res.status(500).json({ 
            success: false, 
            message: 'Fejl ved hentning af blokerede datoer',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Attach mail router (Resend support)
router.use('/mail', require('./mail'));


// Block date/period
router.post('/blocked-dates', requireAdmin, async (req, res) => {
    try {
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
        const existingBookings = await prisma.booking.count({
            where: {
                ønsket_dato: {
                    gte: new Date(startDate),
                    lte: new Date(finalEndDate)
                },
                NOT: { status: 'cancelled' }
            }
        });
        
        if (existingBookings > 0) {
            return res.status(400).json({
                success: false,
                message: `Der er ${existingBookings} eksisterende booking(er) i denne periode. Annuller dem først.`
            });
        }
        
        // Insert blocked period
        const blockedDate = await prisma.blockedDate.create({
            data: {
                start_date: new Date(startDate),
                end_date: new Date(finalEndDate),
                reason: reason || null
            }
        });
        
        // Convert Date objects to ISO strings
        const serializedBlockedDate = {
            ...blockedDate,
            start_date: blockedDate.start_date ? new Date(blockedDate.start_date).toISOString().split('T')[0] : null,
            end_date: blockedDate.end_date ? new Date(blockedDate.end_date).toISOString().split('T')[0] : null,
            created_at: blockedDate.created_at ? blockedDate.created_at.toISOString() : null
        };
        
        res.json({
            success: true,
            blockedDate: serializedBlockedDate,
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
        const { id } = req.params;
        
        const deletedDate = await prisma.blockedDate.delete({
            where: { id: parseInt(id) }
        });
        
        if (!deletedDate) {
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