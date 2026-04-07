/**
 * Tests for admin booking note endpoint
 */
require('./setup');
const request = require('supertest');
const express = require('express');
const adminRouter = require('../routes/admin');
const { prisma } = require('../database/prisma');

describe('Admin - Booking notes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.session = { isAdmin: true, adminUser: { username: 'admin' } };
      next();
    });
    app.use('/api', adminRouter);
  });

  test('Should save multiline note successfully', async () => {
    prisma.booking.update.mockResolvedValueOnce({ id: 27, besked: 'linje 1\nlinje 2' });

    const response = await request(app)
      .put('/api/bookings/27/note')
      .send({ besked: 'linje 1\nlinje 2' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: 27 },
      data: { besked: 'linje 1\nlinje 2' }
    });
  });

  test('Should accept legacy note payload key', async () => {
    prisma.booking.update.mockResolvedValueOnce({ id: 31, besked: 'legacy note' });

    const response = await request(app)
      .put('/api/bookings/31/note')
      .send({ note: 'legacy note' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: 31 },
      data: { besked: 'legacy note' }
    });
  });

  test('Should reject non-string note', async () => {
    const response = await request(app)
      .put('/api/bookings/27/note')
      .send({ besked: { invalid: true } });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/Note skal være tekst/i);
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });

  test('Should reject note longer than 2000 chars', async () => {
    const tooLong = 'a'.repeat(2001);

    const response = await request(app)
      .put('/api/bookings/27/note')
      .send({ besked: tooLong });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/maks være 2000/i);
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });
});
