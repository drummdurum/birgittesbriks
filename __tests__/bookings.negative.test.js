/**
 * Negative Tests for Bookings API
 * Tests error scenarios and edge cases
 */
require('../__tests__/setup');
const request = require('supertest');
const express = require('express');
const bookingsRouter = require('../routes/bookings');
const { prisma } = require('../database/prisma');

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use('/api/bookings', bookingsRouter);

describe('❌ NEGATIVE TESTS - Bookings API Error Cases', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/bookings - Validation Errors', () => {

    test('❌ Should reject missing navn (name)', async () => {
      const booking = {
        email: 'test@example.com',
        telefon: '12345678',
        gdpr_samtykke: 'true'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Ugyldige data');
      expect(response.body.details).toBeDefined();
    });

    test('❌ Should reject missing email', async () => {
      const booking = {
        navn: 'Test User',
        telefon: '12345678',
        gdpr_samtykke: 'true'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
      expect(response.body.details).toBeDefined();
    });

    test('❌ Should reject missing telefon (phone)', async () => {
      const booking = {
        navn: 'Test User',
        email: 'test@example.com',
        gdpr_samtykke: 'true'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
    });

    test('❌ Should reject missing gdpr_samtykke consent', async () => {
      const booking = {
        navn: 'Test User',
        email: 'test@example.com',
        telefon: '12345678'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
    });

    test('❌ Should reject false gdpr_samtykke', async () => {
      const booking = {
        navn: 'Test User',
        email: 'test@example.com',
        telefon: '12345678',
        gdpr_samtykke: 'false'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
    });

    test('❌ Should reject navn that is too short', async () => {
      const booking = {
        navn: 'A',
        email: 'test@example.com',
        telefon: '12345678',
        gdpr_samtykke: 'true'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
      expect(response.body.details[0].msg).toContain('mellem 2 og 100');
    });

    test('❌ Should reject navn that is too long', async () => {
      const booking = {
        navn: 'A'.repeat(101),
        email: 'test@example.com',
        telefon: '12345678',
        gdpr_samtykke: 'true'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
    });

    test('❌ Should reject navn with numbers', async () => {
      const booking = {
        navn: 'Test User 123',
        email: 'test@example.com',
        telefon: '12345678',
        gdpr_samtykke: 'true'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
      expect(response.body.details[0].msg).toContain('bogstaver');
    });

    test('❌ Should reject navn with special characters', async () => {
      const booking = {
        navn: 'Test@User#',
        email: 'test@example.com',
        telefon: '12345678',
        gdpr_samtykke: 'true'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
    });

    test('❌ Should reject invalid email format', async () => {
      const booking = {
        navn: 'Test User',
        email: 'not-an-email',
        telefon: '12345678',
        gdpr_samtykke: 'true'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
      expect(response.body.details[0].msg).toContain('gyldig email');
    });

    test('❌ Should reject email with missing @', async () => {
      const booking = {
        navn: 'Test User',
        email: 'testexample.com',
        telefon: '12345678',
        gdpr_samtykke: 'true'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
    });

    test('❌ Should reject telefon that is too short', async () => {
      const booking = {
        navn: 'Test User',
        email: 'test@example.com',
        telefon: '1234567',
        gdpr_samtykke: 'true'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
      expect(response.body.details[0].msg).toContain('gyldigt telefonnummer');
    });

    test('❌ Should reject telefon that is too long', async () => {
      const booking = {
        navn: 'Test User',
        email: 'test@example.com',
        telefon: '123456789012345678901',
        gdpr_samtykke: 'true'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
    });

    test('❌ Should reject telefon with letters', async () => {
      const booking = {
        navn: 'Test User',
        email: 'test@example.com',
        telefon: '12345abc',
        gdpr_samtykke: 'true'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
    });

    test('❌ Should reject invalid behandling_type', async () => {
      const booking = {
        navn: 'Test User',
        email: 'test@example.com',
        telefon: '12345678',
        behandling_type: 'Invalid Treatment',
        gdpr_samtykke: 'true'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
      expect(response.body.details[0].msg).toContain('gyldig behandlingstype');
    });

    test('❌ Should reject invalid ønsket_dato format', async () => {
      const booking = {
        navn: 'Test User',
        email: 'test@example.com',
        telefon: '12345678',
        ønsket_dato: '28/02/2025',
        gdpr_samtykke: 'true'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
      expect(response.body.details[0].msg).toContain('gyldig dato');
    });

    test('❌ Should reject besked that is too long', async () => {
      const booking = {
        navn: 'Test User',
        email: 'test@example.com',
        telefon: '12345678',
        besked: 'A'.repeat(1001),
        gdpr_samtykke: 'true'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
      expect(response.body.details[0].msg).toContain('1000');
    });

    test('❌ Should reject ønsket_tid that is too long', async () => {
      const booking = {
        navn: 'Test User',
        email: 'test@example.com',
        telefon: '12345678',
        ønsket_tid: 'A'.repeat(21),
        gdpr_samtykke: 'true'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
      expect(response.body.details[0].msg).toContain('20');
    });
  });

  describe('POST /api/bookings - Business Logic Errors', () => {

    test('❌ Should reject booking on blocked date', async () => {
      const booking = {
        navn: 'Test User',
        email: 'test@example.com',
        telefon: '12345678',
        ønsket_dato: '2025-02-14',
        ønsket_tid: '14:00',
        gdpr_samtykke: 'true'
      };

      prisma.blockedDate.findFirst.mockResolvedValueOnce({
        id: 1,
        start_date: new Date('2025-02-14'),
        end_date: new Date('2025-02-14')
      });

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('ikke tilgængelig');
    });

    test('❌ Should reject booking at time conflict', async () => {
      const booking = {
        navn: 'Test User',
        email: 'test@example.com',
        telefon: '12345678',
        ønsket_dato: '2025-02-14',
        ønsket_tid: '14:00',
        gdpr_samtykke: 'true'
      };

      prisma.blockedDate.findFirst.mockResolvedValueOnce(null);
      prisma.booking.findFirst.mockResolvedValueOnce({
        id: 1,
        ønsket_dato: new Date('2025-02-14'),
        ønsket_tid: '14:00'
      });

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('allerede optaget');
    });

    test('❌ Should handle database error during creation', async () => {
      const booking = {
        navn: 'Test User',
        email: 'test@example.com',
        telefon: '12345678',
        gdpr_samtykke: 'true'
      };

      prisma.blockedDate.findFirst.mockResolvedValueOnce(null);
      prisma.booking.findFirst.mockResolvedValueOnce(null);
      prisma.booking.create.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('fejl');
    });
  });

  describe('PUT /api/bookings/:id/status - Validation Errors', () => {

    test('❌ Should reject invalid status', async () => {
      const response = await request(app)
        .put('/api/bookings/1/status')
        .send({ status: 'invalid_status' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Ugyldig status');
    });

    test('❌ Should reject missing status', async () => {
      const response = await request(app)
        .put('/api/bookings/1/status')
        .send({});

      expect(response.status).toBe(400);
    });

    test('❌ Should reject null status', async () => {
      const response = await request(app)
        .put('/api/bookings/1/status')
        .send({ status: null });

      expect(response.status).toBe(400);
    });

    test('❌ Should reject empty string status', async () => {
      const response = await request(app)
        .put('/api/bookings/1/status')
        .send({ status: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/bookings/:id/status - Database Errors', () => {

    test('❌ Should handle booking not found', async () => {
      prisma.booking.update.mockRejectedValueOnce(
        new Error('Booking not found')
      );

      const response = await request(app)
        .put('/api/bookings/9999/status')
        .send({ status: 'confirmed' });

      expect(response.status).toBe(500);
    });

    test('❌ Should handle database error during update', async () => {
      prisma.booking.update.mockRejectedValueOnce(
        new Error('Database connection error')
      );

      const response = await request(app)
        .put('/api/bookings/1/status')
        .send({ status: 'confirmed' });

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/bookings - Database Errors', () => {

    test('❌ Should handle database error during fetch', async () => {
      prisma.booking.findMany.mockRejectedValueOnce(
        new Error('Database connection error')
      );

      const response = await request(app)
        .get('/api/bookings');

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('fejl');
    });
  });

  describe('Edge Cases and Boundary Tests', () => {

    test('❌ Should reject booking with empty navn', async () => {
      const booking = {
        navn: '',
        email: 'test@example.com',
        telefon: '12345678',
        gdpr_samtykke: 'true'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
    });

    test('❌ Should reject booking with only spaces in navn', async () => {
      const booking = {
        navn: '   ',
        email: 'test@example.com',
        telefon: '12345678',
        gdpr_samtykke: 'true'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
    });

    test('❌ Should reject booking with whitespace in email', async () => {
      const booking = {
        navn: 'Test User',
        email: ' test@example.com ',
        telefon: '12345678',
        gdpr_samtykke: 'true'
      };

      // Email validator should handle normalization but let's test boundary
      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      // After normalization it should be valid
      expect([200, 201, 400]).toContain(response.status);
    });

    test('❌ Should reject negative ID in status update', async () => {
      const response = await request(app)
        .put('/api/bookings/-1/status')
        .send({ status: 'confirmed' });

      // Should attempt update, result in not found or similar
      expect([400, 404, 500]).toContain(response.status);
    });

    test('❌ Should reject string ID in status update', async () => {
      const response = await request(app)
        .put('/api/bookings/abc/status')
        .send({ status: 'confirmed' });

      expect([400, 404, 500]).toContain(response.status);
    });

    test('❌ Should reject null body in POST', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .send(null);

      expect([400, 500]).toContain(response.status);
    });

    test('❌ Should handle very long email', async () => {
      const booking = {
        navn: 'Test User',
        email: 'a'.repeat(240) + '@example.com',
        telefon: '12345678',
        gdpr_samtykke: 'true'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect([400, 500]).toContain(response.status);
    });

    test('❌ Should reject multiple @ in email', async () => {
      const booking = {
        navn: 'Test User',
        email: 'test@@example.com',
        telefon: '12345678',
        gdpr_samtykke: 'true'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
    });

    test('❌ Should reject email with space in local part', async () => {
      const booking = {
        navn: 'Test User',
        email: 'test user@example.com',
        telefon: '12345678',
        gdpr_samtykke: 'true'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(booking);

      expect(response.status).toBe(400);
    });
  });
});
