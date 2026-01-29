// Sends a test email to holgerseb@gmail.com using Resend
require('dotenv').config();
const { sendEmailResend } = require('../utils/resend');

(async () => {
  try {
    const result = await sendEmailResend({
      from: process.env.RESEND_FROM || process.env.FROM_EMAIL,
      to: 'holgerseb@gmail.com',
      subject: 'Testmail fra Birgittes Briks',
      html: '<p>Hej — dette er en testmail sendt via Resend fra dit lokale miljø.</p>'
    });

    console.log('✅ Testmail sendt. Resend response:', result);
  } catch (err) {
    console.error('❌ Fejl ved afsendelse af testmail:', err.message || err);
    process.exit(1);
  }
})();