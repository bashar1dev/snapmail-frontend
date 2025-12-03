require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { body, param, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3001;

// ============== SECURITY MIDDLEWARE ==============

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Gzip compression
app.use(compression());

// CORS - restrict to allowed origins
const allowedOrigins = [
  'https://snapmail.pages.dev',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

// Rate limiting - general API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting - mailbox creation (stricter)
const createMailboxLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 mailboxes per hour per IP
  message: { error: 'Too many mailboxes created. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply general rate limiter to all API routes
app.use('/api/', generalLimiter);

// ============== VALIDATION HELPERS ==============
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid input', details: errors.array() });
  }
  next();
};

// Sanitize string input
const sanitizeString = (str) => {
  if (!str) return '';
  return str.toString().trim().slice(0, 10000); // Limit length
};

// Sanitize email address
const sanitizeEmail = (email) => {
  if (!email) return '';
  return email.toString().toLowerCase().trim().slice(0, 255);
};

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/snapmail')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ============== MODELS ==============

// Mailbox Schema
const mailboxSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  created_at: { type: Date, default: Date.now, index: true },
  expires_at: { type: Date, required: true, index: true },
  is_active: { type: Boolean, default: true, index: true }
});

// Compound index for faster queries
mailboxSchema.index({ email: 1, is_active: 1 });
mailboxSchema.index({ expires_at: 1, is_active: 1 });

const Mailbox = mongoose.model('Mailbox', mailboxSchema);

// Email Schema
const emailSchema = new mongoose.Schema({
  mailbox_email: { type: String, required: true, index: true },
  sender: { type: String, required: true },
  subject: { type: String, default: '(No Subject)' },
  body: { type: String, default: '' },
  body_html: { type: String, default: '' },
  received_at: { type: Date, default: Date.now, index: true },
  is_read: { type: Boolean, default: false }
});

// Compound index for email queries
emailSchema.index({ mailbox_email: 1, received_at: -1 });

const Email = mongoose.model('Email', emailSchema);

// ============== HELPER FUNCTIONS ==============

// Generate random email address
function generateEmailAddress(customPrefix = null) {
  const domain = process.env.EMAIL_DOMAIN || 'snapmail.temp';
  
  // If custom prefix provided, validate and use it
  if (customPrefix) {
    const sanitized = customPrefix.toLowerCase()
      .replace(/[^a-z0-9._-]/g, '')
      .slice(0, 20);
    if (sanitized.length >= 3) {
      return `${sanitized}@${domain}`;
    }
  }
  
  // Default: generate random
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let localPart = '';
  for (let i = 0; i < 10; i++) {
    localPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
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
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.2.0'
  });
});

// Create new mailbox (with stricter rate limit)
app.post('/api/mailbox/create', createMailboxLimiter, async (req, res) => {
  try {
    const { prefix, duration = 10 } = req.body || {};
    
    // Validate duration (10, 30, or 60 minutes)
    const validDurations = [10, 30, 60];
    const selectedDuration = validDurations.includes(duration) ? duration : 10;
    
    // Check if custom prefix is already taken
    if (prefix) {
      const domain = process.env.EMAIL_DOMAIN || 'snapmail.temp';
      const sanitized = prefix.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 20);
      if (sanitized.length >= 3) {
        const customEmail = `${sanitized}@${domain}`;
        const existing = await Mailbox.findOne({ email: customEmail, is_active: true });
        if (existing) {
          return res.status(409).json({ error: 'This email prefix is already in use. Try another one.' });
        }
      }
    }
    
    const email = generateEmailAddress(prefix);
    const expiresAt = new Date(Date.now() + selectedDuration * 60 * 1000);
    
    const mailbox = new Mailbox({
      email,
      expires_at: expiresAt
    });
    
    await mailbox.save();
    
    res.json({
      email: mailbox.email,
      created_at: mailbox.created_at,
      expires_at: mailbox.expires_at,
      time_remaining_seconds: getTimeRemaining(mailbox.expires_at),
      duration_minutes: selectedDuration
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

// ============== CLOUDFLARE EMAIL WEBHOOK ==============
// This endpoint receives incoming emails from Cloudflare Email Workers
app.post('/api/webhook/email', async (req, res) => {
  try {
    console.log('📧 Received email from Cloudflare:', JSON.stringify(req.body, null, 2));
    
    const { to, from, subject, text, html } = req.body;
    
    // Extract and sanitize the email address from 'to' field
    const rawToEmail = Array.isArray(to) ? to[0] : to;
    const toEmail = sanitizeEmail(rawToEmail);
    
    if (!toEmail) {
      return res.status(400).json({ error: 'Invalid recipient email' });
    }
    
    // Check if mailbox exists
    const mailbox = await Mailbox.findOne({ email: toEmail, is_active: true });
    
    if (!mailbox) {
      console.log('Mailbox not found for:', toEmail);
      return res.status(200).json({ received: true, stored: false });
    }
    
    // Store the email with sanitized inputs
    const email = new Email({
      mailbox_email: toEmail,
      sender: sanitizeEmail(from) || 'unknown@sender.com',
      subject: sanitizeString(subject) || '(No Subject)',
      body: sanitizeString(text) || '',
      body_html: sanitizeString(html) || ''
    });
    
    await email.save();
    console.log('✅ Email stored successfully for:', toEmail);
    
    res.json({ received: true, stored: true });
  } catch (error) {
    console.error('Cloudflare webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ============== CLEANUP CRON JOB ==============
// Run every minute to clean up expired mailboxes
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    
    // Get expired mailbox emails
    const expiredMailboxes = await Mailbox.find(
      { expires_at: { $lt: now }, is_active: true },
      { email: 1 }
    ).limit(100); // Process max 100 at a time
    
    if (expiredMailboxes.length === 0) return;
    
    const expiredEmails = expiredMailboxes.map(m => m.email);
    
    // Batch delete emails and mailboxes
    await Email.deleteMany({ mailbox_email: { $in: expiredEmails } });
    await Mailbox.deleteMany({ email: { $in: expiredEmails } });
    
    console.log(`🗑️ Cleaned up ${expiredMailboxes.length} expired mailboxes`);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
});

// ============== ERROR HANDLING ==============
// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============== START SERVER ==============
app.listen(PORT, () => {
  console.log(`🚀 SnapMail Backend running on port ${PORT}`);
  console.log(`📧 Email domain: ${process.env.EMAIL_DOMAIN || 'snapmail.temp'}`);
});
