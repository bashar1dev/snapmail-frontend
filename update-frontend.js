/**
 * SnapMail Frontend Configuration
 * 
 * Update this file with your backend URL after deployment
 * Then run: node update-frontend.js
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// 🔧 CONFIGURE YOUR BACKEND URL HERE
// ==========================================
const YOUR_BACKEND_URL = 'http://localhost:3001';
// After deploying to DigitalOcean, change to something like:
// const YOUR_BACKEND_URL = 'https://snapmail-api-xxxxx.ondigitalocean.app';

// ==========================================

const bundlePath = path.join(__dirname, 'static', 'js', 'bundle.js');

// Read the bundle
let bundle = fs.readFileSync(bundlePath, 'utf8');

// Find and replace the BACKEND_URL
const oldUrlPattern = /const BACKEND_URL = "[^"]+"/g;
const newUrl = `const BACKEND_URL = "${YOUR_BACKEND_URL}"`;

if (bundle.match(oldUrlPattern)) {
  bundle = bundle.replace(oldUrlPattern, newUrl);
  fs.writeFileSync(bundlePath, bundle);
  console.log('✅ Frontend updated successfully!');
  console.log(`   Backend URL set to: ${YOUR_BACKEND_URL}`);
} else {
  console.log('⚠️  Could not find BACKEND_URL in bundle.js');
  console.log('   The frontend may already be configured or has a different format.');
}
