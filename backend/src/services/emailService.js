const nodemailer = require('nodemailer');
const dns = require('dns').promises;
const axios = require('axios');

const sendWithResend = async (options) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_USER;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  if (!fromEmail) {
    throw new Error('RESEND_FROM_EMAIL or EMAIL_USER must be configured for Resend');
  }

  await axios.post(
    'https://api.resend.com/emails',
    {
      from: `BlueShield <${fromEmail}>`,
      to: [options.email],
      subject: options.subject,
      text: options.message,
      html: options.html,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  );
};

const sendWithSmtp = async (options) => {
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

const sendEmail = async (options) => {
  if (process.env.RESEND_API_KEY) {
    try {
      await sendWithResend(options);
      return;
    } catch (resendErr) {
      console.error('Resend send failed, trying SMTP fallback:', resendErr.message);
    }
  }

  await sendWithSmtp(options);
};

module.exports = sendEmail;
