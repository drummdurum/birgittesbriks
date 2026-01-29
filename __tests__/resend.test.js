/**
 * Resend integration test
 * NOTE: This test is skipped by default. To run it, set RUN_EMAIL_TEST=true in your environment.
 * Example: RUN_EMAIL_TEST=true npm run test:email
 */

require('dotenv').config();
const { sendEmailResend } = require('../utils/resend');

const RUN = process.env.RUN_EMAIL_TEST === 'true';

(RUN ? test : test.skip)('Sender test-mail via Resend (til holgerseb@gmail.com)', async () => {
  const res = await sendEmailResend({
    from: process.env.RESEND_FROM || process.env.FROM_EMAIL,
    to: 'holgerseb@gmail.com',
    subject: 'Automatisk test: Resend',
    html: '<p>Dette er en automatisk test af Resend-integration.</p>'
  });

  // Basic assertions that Resend returned something useful
  expect(res).toBeDefined();
  // Resend typically returns an object with an `id` or `messageId` field
  expect(res.id || res.messageId || Object.keys(res).length).toBeTruthy();
}, 20000); // 20s timeout for network call