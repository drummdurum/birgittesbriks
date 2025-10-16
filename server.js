const express = require('express');
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import database and routes
const { pool, testConnection } = require('./database/connection');
const { initDatabase } = require('./database/init');
const bookingsRouter = require('./routes/bookings');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      mediaSrc: ["'self'"]
    }
  }
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.RAILWAY_STATIC_URL, 'https://birgittesbriks.up.railway.app']
    : 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/bookings', bookingsRouter);
app.use('/api/admin', require('./routes/admin'));

// Public API for blocked dates (for booking form)
app.get('/api/blocked-dates', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT start_date, end_date FROM blocked_dates ORDER BY start_date ASC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching blocked dates:', error);
        res.status(500).json({ error: 'Kunne ikke hente blokerede datoer' });
    }
});

// Page routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/booking', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'booking.html'));
});

app.get('/booking-confirmation', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'booking.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Handle 404 errors
app.use('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({
        error: 'Der opstod en intern serverfejl. Prøv igen senere.'
    });
});

// Initialize database and start server
const startServer = async () => {
    try {
        // Test database connection
        await testConnection();
        
        // Initialize database schema
        try {
            await initDatabase();
            console.log('✅ Database schema verified');
        } catch (dbError) {
            console.warn('⚠️ Database initialization warning:', dbError.message);
            // Don't fail server start if database init fails
        }
        
        // Start server
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🌿 Birgittes Briks website er klar på http://localhost:${PORT}`);
            console.log(`📱 Tryk Ctrl+C for at stoppe serveren`);
            console.log(`🗄️ Database: ${process.env.NODE_ENV === 'production' ? 'PostgreSQL (Railway)' : 'Local PostgreSQL'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;