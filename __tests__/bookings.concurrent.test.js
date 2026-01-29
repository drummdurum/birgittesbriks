require('../__tests__/setup');
const request = require('supertest');
const express = require('express');
const bookingsRouter = require('../routes/bookings');
const { prisma } = require('../database/prisma');

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use('/api/bookings', bookingsRouter);

describe('Concurrent booking handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Should prevent two simultaneous bookings for the same slot', async () => {
    const bookingPayload = {
      navn: 'Concurrent User',
      email: 'concurrent@example.com',
      telefon: '12345678',
      ønsket_dato: '2025-06-01',
      ønsket_tid: '14:00',
      gdpr_samtykke: 'true'
    };

    // No blocked date
    prisma.blockedDate.findFirst.mockResolvedValue(null);
    // Conflict check returns null so both will attempt to create
    prisma.booking.findFirst.mockResolvedValue(null);

    // Simulate first create succeeds, second create fails with unique constraint (Prisma P2002)
    prisma.booking.create
      .mockResolvedValueOnce({ id: 111, created_at: new Date() })
      .mockRejectedValueOnce(Object.assign(new Error('Unique constraint'), { code: 'P2002' }));

    // Fire both requests in parallel
    const [res1, res2] = await Promise.all([
      request(app).post('/api/bookings').send(bookingPayload),
      request(app).post('/api/bookings').send(bookingPayload)
    ]);

    // One should succeed, the other should get a 400 conflict
    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([201, 400]);

    const conflictResponse = res1.status === 400 ? res1 : res2;
    expect(conflictResponse.body.error).toContain('allerede optaget');
  });
});