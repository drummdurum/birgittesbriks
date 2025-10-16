const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Email templates
const getCustomerConfirmationTemplate = (booking) => {
  const { navn, ønsket_dato, ønsket_tid, behandling_type, bookingId } = booking;
  
  return {
    subject: 'Bekræftelse på din booking hos Birgittes Briks',
    html: `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #a4c3a2; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .booking-details { background: #f8f8f8; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .footer { background: #666; color: white; padding: 20px; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Birgittes Briks</h1>
                <p>Klinik for kropsterapi</p>
            </div>
            
            <div class="content">
                <h2>Kære ${navn}</h2>
                
                <p>Tak for din booking-forespørgsel. Vi har modtaget din henvendelse og vil kontakte dig snarest for at bekræfte din tid.</p>
                
                <div class="booking-details">
                    <h3>Dine booking-detaljer:</h3>
                    <p><strong>Booking ID:</strong> #${bookingId}</p>
                    <p><strong>Behandlingstype:</strong> ${behandling_type}</p>
                    ${ønsket_dato ? `<p><strong>Ønsket dato:</strong> ${new Date(ønsket_dato).toLocaleDateString('da-DK')}</p>` : ''}
                    ${ønsket_tid ? `<p><strong>Ønsket tidspunkt:</strong> ${ønsket_tid}</p>` : ''}
                </div>
                
                <p><strong>Hvad sker der nu?</strong></p>
                <ul>
                    <li>Vi gennemgår din forespørgsel</li>
                    <li>Du vil høre fra os inden for 24 timer</li>
                    <li>Vi bekræfter tid og sted for din behandling</li>
                </ul>
                
                <p>Har du spørgsmål i mellemtiden, er du velkommen til at kontakte os:</p>
                <ul>
                    <li>📞 Telefon: +45 21 85 34 17</li>
                    <li>✉️ Email: ${process.env.FROM_EMAIL}</li>
                </ul>
                
                <p>Vi glæder os til at se dig!</p>
                
                <p>Med venlig hilsen<br><strong>Birgitte</strong><br>Birgittes Briks</p>
            </div>
            
            <div class="footer">
                <p>Birgittes Briks | Barnekærvej 6, 3660 Stenløse | +45 21 85 34 17</p>
            </div>
        </div>
    </body>
    </html>
    `
  };
};

const getAdminNotificationTemplate = (booking) => {
  const { navn, email, telefon, ønsket_dato, ønsket_tid, behandling_type, besked, bookingId, created_at } = booking;
  
  return {
    subject: `Ny booking fra ${navn} (#${bookingId})`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #666; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .booking-info { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .urgent { background: #ffebee; border-left: 4px solid #f44336; padding: 10px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Ny booking modtaget</h1>
            </div>
            
            <div class="content">
                <div class="urgent">
                    <strong>Ny booking kræver din opmærksomhed!</strong>
                </div>
                
                <div class="booking-info">
                    <h3>Booking detaljer:</h3>
                    <p><strong>Booking ID:</strong> #${bookingId}</p>
                    <p><strong>Modtaget:</strong> ${new Date(created_at).toLocaleString('da-DK')}</p>
                    <hr>
                    <p><strong>Navn:</strong> ${navn}</p>
                    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                    <p><strong>Telefon:</strong> <a href="tel:${telefon}">${telefon}</a></p>
                    <p><strong>Behandlingstype:</strong> ${behandling_type}</p>
                    ${ønsket_dato ? `<p><strong>Ønsket dato:</strong> ${new Date(ønsket_dato).toLocaleDateString('da-DK')}</p>` : '<p><strong>Ønsket dato:</strong> Ikke angivet</p>'}
                    ${ønsket_tid ? `<p><strong>Ønsket tid:</strong> ${ønsket_tid}</p>` : '<p><strong>Ønsket tid:</strong> Ikke angivet</p>'}
                </div>
                
                ${besked ? `
                <div class="booking-info">
                    <h4>Besked fra kunden:</h4>
                    <p style="font-style: italic;">"${besked}"</p>
                </div>
                ` : ''}
                
                <p><strong>Næste skridt:</strong></p>
                <ul>
                    <li>Kontakt kunden inden for 24 timer</li>
                    <li>Bekræft eller foreslå alternativ tid</li>
                    <li>Opdater booking status i systemet</li>
                </ul>
            </div>
        </div>
    </body>
    </html>
    `
  };
};

// Send confirmation email to customer
const sendBookingConfirmation = async (booking) => {
  const template = getCustomerConfirmationTemplate(booking);
  
  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: booking.email,
    subject: template.subject,
    html: template.html
  };

  return await transporter.sendMail(mailOptions);
};

// Send notification email to admin
const sendBookingNotification = async (booking) => {
  const template = getAdminNotificationTemplate(booking);
  
  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: process.env.FROM_EMAIL, // Send to business email
    subject: template.subject,
    html: template.html
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = {
  sendBookingConfirmation,
  sendBookingNotification
};