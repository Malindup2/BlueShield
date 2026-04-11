const nodemailer = require('nodemailer');
const dns = require('dns').promises;

const sendEmail = async (options) => {
  const smtpHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.EMAIL_PORT || 587);
  let smtpConnectHost = smtpHost;

  // Render may not have a working IPv6 route for Gmail SMTP.
  // Resolve and prefer IPv4 address when available.
  try {
    const ipv4Addresses = await dns.resolve4(smtpHost);
    if (ipv4Addresses && ipv4Addresses.length > 0) {
      smtpConnectHost = ipv4Addresses[0];
    }
  } catch (resolveErr) {
    // Fallback to hostname if IPv4 resolution fails.
    console.warn(`SMTP IPv4 resolve failed for ${smtpHost}:`, resolveErr.message);
  }

  // Create a transporter
  const transporterConfig = {
    host: smtpConnectHost,
    port: smtpPort,
    secure: smtpPort === 465,
    requireTLS: smtpPort !== 465,
    family: 4,
    tls: {
      servername: smtpHost,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  };

  const transporter = nodemailer.createTransport(transporterConfig);

  // Define email options
  const mailOptions = {
    from: `BlueShield <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
