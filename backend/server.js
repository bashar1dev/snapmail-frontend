require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { body, param, query, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3001;

// ============== SECURITY MIDDLEWARE ==============

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Gzip compression
app.use(compression());

// CORS - configurable via env (comma-separated list)
const defaultOrigins = ['https://snapmail.pages.dev', 'http://localhost:3000', 'http://localhost:5173'];
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : defaultOrigins;

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

// Rate limiting - general API (excludes webhooks)
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

// Apply general rate limiter to all API routes EXCEPT webhooks
// Webhooks need to be unrestricted for email delivery services
app.use('/api/', (req, res, next) => {
  // Skip rate limiting for webhook endpoints
  if (req.path.startsWith('/webhook/')) {
    return next();
  }
  return generalLimiter(req, res, next);
});

// ============== VALIDATION HELPERS ==============
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid input', details: errors.array() });
  }
  next();
};

// Size limits for content
const MAX_SUBJECT_LENGTH = 500;
const MAX_BODY_LENGTH = 100000; // 100KB
const MAX_EMAIL_LENGTH = 255;

// Sanitize string input with configurable max length
const sanitizeString = (str, maxLength = MAX_BODY_LENGTH) => {
  if (!str) return '';
  return str.toString().trim().slice(0, maxLength);
};

// Sanitize email address
const sanitizeEmail = (email) => {
  if (!email) return '';
  return email.toString().toLowerCase().trim().slice(0, MAX_EMAIL_LENGTH);
};

// Strip potentially dangerous HTML tags (keep basic formatting)
const sanitizeHtml = (html, maxLength = MAX_BODY_LENGTH) => {
  if (!html) return '';
  let sanitized = html.toString().slice(0, maxLength);
  // Remove script tags and event handlers
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]+/gi, '');
  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  // Remove data: URLs in src/href (potential XSS)
  sanitized = sanitized.replace(/(src|href)\s*=\s*["']?\s*data:/gi, '$1="');
  return sanitized;
};

// Validate MongoDB ObjectId format
const isValidObjectId = (id) => {
  return /^[a-fA-F0-9]{24}$/.test(id);
};

// Validate email format
const isValidEmailFormat = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

// Create new mailbox (with stricter rate limit and validation)
app.post('/api/mailbox/create', 
  createMailboxLimiter,
  [
    body('duration').optional().isInt().isIn([10, 30, 60]).withMessage('Duration must be 10, 30, or 60 minutes'),
    body('prefix').optional().isString().isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9._-]+$/).withMessage('Prefix must be 3-20 alphanumeric characters')
  ],
  handleValidationErrors,
  async (req, res) => {
  try {
    const { prefix, duration = 10 } = req.body || {};
    
    // Validate duration (10, 30, or 60 minutes)
    const validDurations = [10, 30, 60];
    const selectedDuration = validDurations.includes(duration) ? duration : 10;
    
    const domain = process.env.EMAIL_DOMAIN || 'snapmail.temp';
    const MAX_RETRIES = 3;
    let attempts = 0;
    let mailbox = null;
    
    while (attempts < MAX_RETRIES) {
      attempts++;
      
      // Generate email address
      let email;
      if (prefix && attempts === 1) {
        // First attempt: try custom prefix if provided
        const sanitized = prefix.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 20);
        if (sanitized.length >= 3) {
          email = `${sanitized}@${domain}`;
          // Check if custom prefix is already taken
          const existing = await Mailbox.findOne({ email, is_active: true });
          if (existing) {
            return res.status(409).json({ error: 'This email prefix is already in use. Try another one.' });
          }
        } else {
          email = generateEmailAddress();
        }
      } else {
        // Retry or no prefix: generate random
        email = generateEmailAddress();
      }
      
      const expiresAt = new Date(Date.now() + selectedDuration * 60 * 1000);
      
      try {
        mailbox = new Mailbox({ email, expires_at: expiresAt });
        await mailbox.save();
        break; // Success, exit loop
      } catch (err) {
        // If duplicate key error and we have retries left, try again with new address
        if (err.code === 11000 && attempts < MAX_RETRIES) {
          console.log(`Duplicate key collision, retrying (attempt ${attempts}/${MAX_RETRIES})`);
          continue;
        }
        throw err; // Re-throw if not a collision or no retries left
      }
    }
    
    if (!mailbox) {
      return res.status(500).json({ error: 'Failed to create mailbox after multiple attempts' });
    }
    
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


// Get mailbox info (with validation)
app.get('/api/mailbox/:email',
  [
    param('email').isEmail().normalizeEmail().withMessage('Invalid email format')
  ],
  handleValidationErrors,
  async (req, res) => {
  try {
    const email = sanitizeEmail(req.params.email);
    const mailbox = await Mailbox.findOne({ email, is_active: true });
    
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

// Get emails for mailbox (with validation)
app.get('/api/mailbox/:email/emails',
  [
    param('email').isEmail().normalizeEmail().withMessage('Invalid email format')
  ],
  handleValidationErrors,
  async (req, res) => {
  try {
    const email = sanitizeEmail(req.params.email);
    const emails = await Email.find({ mailbox_email: email })
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

// Refresh mailbox timer (with validation)
app.post('/api/mailbox/:email/refresh',
  [
    param('email').isEmail().normalizeEmail().withMessage('Invalid email format')
  ],
  handleValidationErrors,
  async (req, res) => {
  try {
    const email = sanitizeEmail(req.params.email);
    const mailbox = await Mailbox.findOne({ email, is_active: true });
    
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

// Delete mailbox (with validation)
app.delete('/api/mailbox/:email',
  [
    param('email').isEmail().normalizeEmail().withMessage('Invalid email format')
  ],
  handleValidationErrors,
  async (req, res) => {
  try {
    const email = sanitizeEmail(req.params.email);
    await Mailbox.deleteOne({ email });
    await Email.deleteMany({ mailbox_email: email });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete mailbox' });
  }
});

// Generate test email (with validation)
app.post('/api/mailbox/:email/generate-email',
  [
    param('email').isEmail().normalizeEmail().withMessage('Invalid email format')
  ],
  handleValidationErrors,
  async (req, res) => {
  try {
    const email = sanitizeEmail(req.params.email);
    const mailbox = await Mailbox.findOne({ email, is_active: true });
    
    if (!mailbox) {
      return res.status(404).json({ error: 'Mailbox not found' });
    }
    
    const testEmail = new Email({
      mailbox_email: email,
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

// Get single email by ID (with validation)
app.get('/api/email/:id',
  [
    param('id').custom((value) => isValidObjectId(value)).withMessage('Invalid email ID format')
  ],
  handleValidationErrors,
  async (req, res) => {
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
// NOTE: No rate limiting on webhooks - email services need unrestricted access
app.post('/api/webhook/testmail', async (req, res) => {
  try {
    console.log('📧 Received webhook from Testmail:', JSON.stringify(req.body, null, 2));
    
    const { to, from, subject, text, html } = req.body;
    
    // Extract and sanitize the email address from 'to' field
    const rawToEmail = Array.isArray(to) ? to[0] : to;
    const toEmail = sanitizeEmail(rawToEmail);
    
    if (!toEmail || !isValidEmailFormat(toEmail)) {
      return res.status(400).json({ error: 'Invalid recipient email' });
    }
    
    // Check if mailbox exists
    const mailbox = await Mailbox.findOne({ email: toEmail, is_active: true });
    
    if (!mailbox) {
      console.log('Mailbox not found for:', toEmail);
      return res.status(200).json({ received: true, stored: false });
    }
    
    // Store the email with sanitized and size-limited inputs
    const email = new Email({
      mailbox_email: toEmail,
      sender: sanitizeEmail(from) || 'unknown@sender.com',
      subject: sanitizeString(subject, MAX_SUBJECT_LENGTH) || '(No Subject)',
      body: sanitizeString(text, MAX_BODY_LENGTH) || '',
      body_html: sanitizeHtml(html, MAX_BODY_LENGTH) || ''
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
// NOTE: No rate limiting on webhooks - email services need unrestricted access
app.post('/api/webhook/email', async (req, res) => {
  try {
    console.log('📧 Received email from Cloudflare:', JSON.stringify(req.body, null, 2));
    
    const { to, from, subject, text, html } = req.body;
    
    // Extract and sanitize the email address from 'to' field
    const rawToEmail = Array.isArray(to) ? to[0] : to;
    const toEmail = sanitizeEmail(rawToEmail);
    
    if (!toEmail || !isValidEmailFormat(toEmail)) {
      return res.status(400).json({ error: 'Invalid recipient email' });
    }
    
    // Check if mailbox exists
    const mailbox = await Mailbox.findOne({ email: toEmail, is_active: true });
    
    if (!mailbox) {
      console.log('Mailbox not found for:', toEmail);
      return res.status(200).json({ received: true, stored: false });
    }
    
    // Store the email with sanitized and size-limited inputs
    const email = new Email({
      mailbox_email: toEmail,
      sender: sanitizeEmail(from) || 'unknown@sender.com',
      subject: sanitizeString(subject, MAX_SUBJECT_LENGTH) || '(No Subject)',
      body: sanitizeString(text, MAX_BODY_LENGTH) || '',
      body_html: sanitizeHtml(html, MAX_BODY_LENGTH) || ''
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
