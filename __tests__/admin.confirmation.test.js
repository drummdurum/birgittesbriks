/**
 * Test that admin confirming a booking triggers final confirmation email
 */
require('./setup');
const request = require('supertest');
const express = require('express');
const adminRouter = require('../routes/admin');
const { prisma } = require('../database/prisma');
const { sendBookingFinalConfirmation } = require('../utils/email');

describe('Admin - Final confirmation email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Should call sendBookingFinalConfirmation when status set to confirmed', async () => {
    prisma.booking.update.mockResolvedValueOnce({
      id: 42,
      navn: 'Test User',
      email: 'test@example.com',
      telefon: '12345678',
      ønsket_dato: new Date('2025-02-15'),
      ønsket_tid: '10:00',
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
      .put('/api/bookings/42/status')
      .send({ status: 'confirmed' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Allow microtasks to complete so the fire-and-forget async IIFE runs
    await new Promise(resolve => setImmediate(resolve));

    expect(sendBookingFinalConfirmation).toHaveBeenCalledTimes(1);
    expect(sendBookingFinalConfirmation).toHaveBeenCalledWith(expect.objectContaining({
      navn: 'Test User',
      email: 'test@example.com',
      telefon: '12345678',
      ønsket_dato: '2025-02-15',
      ønsket_tid: '10:00',
      behandling_type: 'Enkelt behandling',
      besked: 'note',
      bookingId: 42
    }));
  });
});