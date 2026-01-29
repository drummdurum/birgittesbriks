/**
 * Test that admin send-final endpoint calls sendBookingFinalConfirmation
 */
require('./setup');
const request = require('supertest');
const express = require('express');
const adminRouter = require('../routes/admin');
const { prisma } = require('../database/prisma');
const { sendBookingFinalConfirmation } = require('../utils/email');

describe('Admin - Send final confirmation endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Should call sendBookingFinalConfirmation and return success', async () => {
    prisma.booking.findUnique.mockResolvedValueOnce({
      id: 99,
      navn: 'Test User',
      email: 'test@example.com',
      telefon: '12345678',
      ønsket_dato: new Date('2025-03-01'),
      ønsket_tid: '11:00',
      behandling_type: 'Enkelt behandling',
      besked: 'note',
      status: 'confirmed',
      created_at: new Date()
    });

    const app = express();
    app.use(express.json());
    // Mock session for admin authentication
    app.use((req, res, next) => {
      req.session = { isAdmin: true, adminUser: { username: 'admin' } };
      next();
    });
    app.use('/api', adminRouter);

    const response = await request(app)
      .post('/api/bookings/99/send-final')
      .send();

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(sendBookingFinalConfirmation).toHaveBeenCalledTimes(1);
  });

  test('Should return 404 when booking not found', async () => {
    prisma.booking.findUnique.mockResolvedValueOnce(null);

    const app = express();
    app.use(express.json());
    app.use((req, res, next) => { req.session = { isAdmin: true }; next(); });
    app.use('/api', adminRouter);

    const response = await request(app).post('/api/bookings/123/send-final');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  test('Should return 400 when booking has no email', async () => {
    prisma.booking.findUnique.mockResolvedValueOnce({ id: 100, email: null });

    const app = express();
    app.use(express.json());
    app.use((req, res, next) => { req.session = { isAdmin: true }; next(); });
    app.use('/api', adminRouter);

    const response = await request(app).post('/api/bookings/100/send-final');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});