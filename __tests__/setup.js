/**
 * Test setup and mock configuration
 */
jest.mock('../database/prisma', () => ({
  prisma: {
    booking: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    blockedDate: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    blockedTime: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn()
    }
  },
  pool: {},
  testConnection: jest.fn()
}));

jest.mock('../utils/email', () => ({
  sendBookingConfirmation: jest.fn().mockResolvedValue(true),
  sendBookingNotification: jest.fn().mockResolvedValue(true),
  sendBookingFinalConfirmation: jest.fn().mockResolvedValue(true)
}));

// Mock express-rate-limit to disable it for testing
jest.mock('express-rate-limit', () => {
  return jest.fn(() => (req, res, next) => next());
});

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'test123';

