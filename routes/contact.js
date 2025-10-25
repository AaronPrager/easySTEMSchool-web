const express = require('express');
const nodemailer = require('nodemailer');
const database = require('../database');
const router = express.Router();

// Contact form endpoint
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !message) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'easystemschool@gmail.com',
      subject: `New Contact Form Submission from ${firstName} ${lastName}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>This message was sent from the Easy STEM School contact form.</em></p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>IP Address:</strong> ${req.ip || req.connection.remoteAddress}</p>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Save to database
    const contactData = {
      firstName,
      lastName,
      email,
      phone,
      message,
      ipAddress: req.ip || req.connection.remoteAddress
    };
    
    const dbResult = await database.saveContact(contactData);
    console.log('Contact saved to database:', dbResult);

    res.status(200).json({ 
      success: true,
      message: 'Email sent successfully',
      databaseId: dbResult.id
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send email' 
    });
  }
});

module.exports = router;
