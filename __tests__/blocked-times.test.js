/**
 * Tests for blocked time slots (admin + availability + booking)
 */
require('./setup');
const request = require('supertest');
const express = require('express');
const bookingsRouter = require('../routes/bookings');
const availabilityRouter = require('../routes/availability');
const adminRouter = require('../routes/admin');
const { prisma } = require('../database/prisma');

describe('Blocked times feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Availability returns blocked times for a date', async () => {
    const app = express();
    app.use('/api/availability', availabilityRouter);

    prisma.blockedDate.findFirst.mockResolvedValueOnce(null);
    prisma.booking.findMany.mockResolvedValueOnce([]);
    prisma.blockedTime.findMany.mockResolvedValueOnce([
      { time: '14:30' },
      { time: '16:00' }
    ]);

    const response = await request(app).get('/api/availability?date=2025-02-14');

    expect(response.status).toBe(200);
    expect(response.body.blocked).toBe(false);
    expect(response.body.blockedTimes).toEqual(['14:30', '16:00']);
  });

  test('Booking rejects blocked time slot', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/bookings', bookingsRouter);

    prisma.blockedDate.findFirst.mockResolvedValueOnce(null);
    prisma.blockedTime.findFirst.mockResolvedValueOnce({
      id: 1,
      date: new Date('2025-02-14'),
      time: '14:30'
    });

    const response = await request(app)
      .post('/api/bookings')
      .send({
        navn: 'Test User',
        email: 'test@example.com',
        telefon: '12345678',
        ønsket_dato: '2025-02-14',
        ønsket_tid: '14:30',
        gdpr_samtykke: 'true'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('blokeret');
  });

  test('Admin can create and list blocked times', async () => {
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.session = { isAdmin: true, adminUser: { username: 'admin' } };
      next();
    });
    app.use('/api/admin', adminRouter);

    prisma.blockedDate.findFirst.mockResolvedValueOnce(null);
    prisma.booking.findFirst.mockResolvedValueOnce(null);
    prisma.blockedTime.findFirst.mockResolvedValueOnce(null);
    prisma.blockedTime.create.mockResolvedValueOnce({
      id: 10,
      date: new Date('2025-02-14'),
      time: '14:30',
      reason: 'Pause',
      created_at: new Date()
    });

    const createResponse = await request(app)
      .post('/api/admin/blocked-times')
      .send({
        date: '2025-02-14',
        time: '14:30',
        reason: 'Pause'
      });

    expect(createResponse.status).toBe(200);
    expect(createResponse.body.success).toBe(true);

    prisma.blockedTime.findMany.mockResolvedValueOnce([
      { id: 10, date: new Date('2025-02-14'), time: '14:30', reason: 'Pause', created_at: new Date() }
    ]);

    const listResponse = await request(app).get('/api/admin/blocked-times');

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body)).toBe(true);
    expect(listResponse.body[0].time).toBe('14:30');
  });
});
