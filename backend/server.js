require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/snapmail')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ============== MODELS ==============

// Mailbox Schema
const mailboxSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now },
  expires_at: { type: Date, required: true },
  is_active: { type: Boolean, default: true }
});

const Mailbox = mongoose.model('Mailbox', mailboxSchema);

// Email Schema
const emailSchema = new mongoose.Schema({
  mailbox_email: { type: String, required: true, index: true },
  sender: { type: String, required: true },
  subject: { type: String, default: '(No Subject)' },
  body: { type: String, default: '' },
  body_html: { type: String, default: '' },
  received_at: { type: Date, default: Date.now },
  is_read: { type: Boolean, default: false }
});

const Email = mongoose.model('Email', emailSchema);

// ============== HELPER FUNCTIONS ==============

// Generate random email address
function generateEmailAddress() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let localPart = '';
  for (let i = 0; i < 10; i++) {
    localPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const domain = process.env.EMAIL_DOMAIN || 'snapmail.temp';
  return `${localPart}@${domain}`;
}

// Calculate time remaining in seconds
function getTimeRemaining(expiresAt) {
  const now = new Date();
  const diff = new Date(expiresAt) - now;
  return Math.max(0, Math.floor(diff / 1000));
}

// ============== API ROUTES ==============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create new mailbox
app.post('/api/mailbox/create', async (req, res) => {
  try {
    const email = generateEmailAddress();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    const mailbox = new Mailbox({
      email,
      expires_at: expiresAt
    });
    
    await mailbox.save();
    
    res.json({
      email: mailbox.email,
      created_at: mailbox.created_at,
      expires_at: mailbox.expires_at,
      time_remaining_seconds: getTimeRemaining(mailbox.expires_at)
    });
  } catch (error) {
    console.error('Error creating mailbox:', error);
    res.status(500).json({ error: 'Failed to create mailbox' });
  }
});

// Get mailbox info
app.get('/api/mailbox/:email', async (req, res) => {
  try {
    const mailbox = await Mailbox.findOne({ email: req.params.email, is_active: true });
    
    if (!mailbox) {
      return res.status(404).json({ error: 'Mailbox not found' });
    }
    
    res.json({
      email: mailbox.email,
      created_at: mailbox.created_at,
      expires_at: mailbox.expires_at,
      time_remaining_seconds: getTimeRemaining(mailbox.expires_at)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get mailbox' });
  }
});

// Get emails for mailbox
app.get('/api/mailbox/:email/emails', async (req, res) => {
  try {
    const emails = await Email.find({ mailbox_email: req.params.email })
      .sort({ received_at: -1 })
      .limit(50);
    
    res.json({
      emails: emails.map(e => ({
        id: e._id,
        sender: e.sender || 'unknown@sender.com',
        subject: e.subject || '(No Subject)',
        preview: (e.body || '').substring(0, 100),
        received_at: e.received_at,
        is_read: e.is_read
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get emails' });
  }
});

// Refresh mailbox timer (extend by 10 minutes)
app.post('/api/mailbox/:email/refresh', async (req, res) => {
  try {
    const mailbox = await Mailbox.findOne({ email: req.params.email, is_active: true });
    
    if (!mailbox) {
      return res.status(404).json({ error: 'Mailbox not found' });
    }
    
    mailbox.expires_at = new Date(Date.now() + 10 * 60 * 1000);
    await mailbox.save();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to refresh mailbox' });
  }
});

// Delete mailbox
app.delete('/api/mailbox/:email', async (req, res) => {
  try {
    await Mailbox.deleteOne({ email: req.params.email });
    await Email.deleteMany({ mailbox_email: req.params.email });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete mailbox' });
  }
});

// Generate test email (for testing purposes)
app.post('/api/mailbox/:email/generate-email', async (req, res) => {
  try {
    const mailbox = await Mailbox.findOne({ email: req.params.email, is_active: true });
    
    if (!mailbox) {
      return res.status(404).json({ error: 'Mailbox not found' });
    }
    
    const testEmail = new Email({
      mailbox_email: req.params.email,
      sender: 'test@example.com',
      subject: 'Test Email - ' + new Date().toLocaleTimeString(),
      body: 'This is a test email generated at ' + new Date().toLocaleString() + '\n\nYour SnapMail inbox is working correctly!',
      body_html: '<p>This is a test email generated at ' + new Date().toLocaleString() + '</p><p>Your SnapMail inbox is working correctly!</p>'
    });
    
    await testEmail.save();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate test email' });
  }
});

// Get single email by ID
app.get('/api/email/:id', async (req, res) => {
  try {
    const email = await Email.findById(req.params.id);
    
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    // Mark as read
    email.is_read = true;
    await email.save();
    
    res.json({
      id: email._id,
      sender: email.sender,
      subject: email.subject,
      body: email.body,
      body_html: email.body_html,
      received_at: email.received_at,
      is_read: email.is_read
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get email' });
  }
});

// ============== TESTMAIL WEBHOOK ==============
// This endpoint receives incoming emails from Testmail.app
app.post('/api/webhook/testmail', async (req, res) => {
  try {
    console.log('📧 Received webhook from Testmail:', JSON.stringify(req.body, null, 2));
    
    const { to, from, subject, text, html } = req.body;
    
    // Extract the email address from 'to' field
    const toEmail = Array.isArray(to) ? to[0] : to;
    
    // Check if mailbox exists
    const mailbox = await Mailbox.findOne({ email: toEmail, is_active: true });
    
    if (!mailbox) {
      console.log('Mailbox not found for:', toEmail);
      return res.status(200).json({ received: true, stored: false });
    }
    
    // Store the email
    const email = new Email({
      mailbox_email: toEmail,
      sender: from || 'unknown@sender.com',
      subject: subject || '(No Subject)',
      body: text || '',
      body_html: html || ''
    });
    
    await email.save();
    console.log('✅ Email stored successfully');
    
    res.json({ received: true, stored: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ============== CLEANUP CRON JOB ==============
// Run every minute to clean up expired mailboxes
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const expired = await Mailbox.find({ expires_at: { $lt: now }, is_active: true });
    
    for (const mailbox of expired) {
      await Email.deleteMany({ mailbox_email: mailbox.email });
      await Mailbox.deleteOne({ _id: mailbox._id });
      console.log(`🗑️ Cleaned up expired mailbox: ${mailbox.email}`);
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
});

// ============== START SERVER ==============
app.listen(PORT, () => {
  console.log(`🚀 SnapMail Backend running on port ${PORT}`);
  console.log(`📧 Email domain: ${process.env.EMAIL_DOMAIN || 'snapmail.temp'}`);
});
