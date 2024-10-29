const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'vps.vw-liftech.co.in',
    port: 587, // Use 465 for SSL
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    debug: true, // Show debug output
    logger: true // Log information to console
  });

//   const transporter = nodemailer.createTransport({
//     service: 'gmail', // Using Gmail service
//     auth: {
//       user: process.env.EMAIL_USER, // Your Gmail address
//       pass: process.env.EMAIL_PASS,  // Your App Password
//     },
//     debug: true, // Enable debug output
//     logger: true, // Log output to console
//   });
// Define the send-email route
router.post('/send-email', async (req, res) => {
  const { to, subject, text, html } = req.body;

  // Check if required fields are present
  if (!to || !subject || !text) {
    return res.status(400).json({ msg: 'Please provide email, subject, and message content.' });
  }

  // Set up email data
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  };

  try {
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email', error });
  }
});

module.exports = router;
