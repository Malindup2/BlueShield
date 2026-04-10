const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter
  const transporterConfig = {
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  };

  // If using Gmail, it's more reliable to use the 'service' preset
  if (process.env.EMAIL_HOST === 'smtp.gmail.com') {
    transporterConfig.service = 'gmail';
  } else {
    transporterConfig.host = process.env.EMAIL_HOST;
    transporterConfig.port = process.env.EMAIL_PORT;
    transporterConfig.secure = process.env.EMAIL_PORT == 465;
  }

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
