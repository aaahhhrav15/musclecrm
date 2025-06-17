const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const twilio = require('twilio');


// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Configure Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send email to all members
router.post('/email', async (req, res) => {
  try {
    const { subject, content } = req.body;

    // Get all members with email addresses
    const members = await Member.find({ 
      email: { $exists: true, $ne: null },
      status: 'active'
    });

    if (members.length === 0) {
      return res.status(404).json({ 
        message: 'No active members found with email addresses' 
      });
    }

    // Send email to each member
    const emailPromises = members.map(member => {
      return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: member.email,
        subject: subject,
        text: content,
        html: content.replace(/\n/g, '<br>')
      });
    });

    await Promise.all(emailPromises);

    res.json({ 
      message: 'Emails sent successfully',
      count: members.length
    });
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ message: 'Error sending emails' });
  }
});

// Send SMS to all members
router.post('/sms', async (req, res) => {
  try {
    const { content } = req.body;

    // Get all members with phone numbers
    const members = await Member.find({ 
      phone: { $exists: true, $ne: null },
      status: 'active'
    });

    if (members.length === 0) {
      return res.status(404).json({ 
        message: 'No active members found with phone numbers' 
      });
    }

    // Send SMS to each member
    const smsPromises = members.map(member => {
      return twilioClient.messages.create({
        body: content,
        to: member.phone,
        from: process.env.TWILIO_PHONE_NUMBER
      });
    });

    await Promise.all(smsPromises);

    res.json({ 
      message: 'SMS messages sent successfully',
      count: members.length
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ message: 'Error sending SMS messages' });
  }
});

// Send WhatsApp broadcast to all members
router.post('/whatsapp/broadcast', async (req, res) => {
  try {
    const { content } = req.body;

    // Get all members with phone numbers
    const members = await Member.find({ 
      phone: { $exists: true, $ne: null },
      status: 'active'
    });

    if (members.length === 0) {
      return res.status(404).json({ 
        message: 'No active members found with phone numbers' 
      });
    }

    // Send WhatsApp message to each member
    const whatsappPromises = members.map(member => {
      return twilioClient.messages.create({
        body: content,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${member.phone}`
      });
    });

    await Promise.all(whatsappPromises);

    res.json({ 
      message: 'WhatsApp broadcast sent successfully',
      count: members.length
    });
  } catch (error) {
    console.error('Error sending WhatsApp broadcast:', error);
    res.status(500).json({ message: 'Error sending WhatsApp broadcast' });
  }
});

// Send WhatsApp message to individual member
router.post('/whatsapp/individual', async (req, res) => {
  try {
    const { memberId, content } = req.body;

    // Find the member
    const member = await Member.findOne({ 
      _id: memberId,
      phone: { $exists: true, $ne: null },
      status: 'active'
    });

    if (!member) {
      return res.status(404).json({ 
        message: 'Member not found or does not have a valid phone number' 
      });
    }

    // Send WhatsApp message
    await twilioClient.messages.create({
      body: content,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${member.phone}`
    });

    res.json({ 
      message: 'WhatsApp message sent successfully',
      recipient: `${member.firstName} ${member.lastName}`
    });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({ message: 'Error sending WhatsApp message' });
  }
});

module.exports = router; 