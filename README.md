# 📧 SnapMail - Temporary Email Service

A complete temporary email service with your own database and backend, using free GitHub Student Developer Pack offers.

## 🏗️ Project Structure

```
experment/
├── index.html              # Frontend (React app)
├── static/js/bundle.js     # Frontend JavaScript bundle
├── update-frontend.js      # Script to update backend URL
├── backend/                # Your Node.js backend
│   ├── server.js           # Express API server
│   ├── package.json        # Node dependencies
│   ├── .env.example        # Environment template
│   └── README.md           # Backend documentation
```

## 🚀 Quick Start (Local Development)

### Step 1: Set Up MongoDB Atlas (Free with GitHub Student Pack)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up and claim GitHub Student Pack credits ($50 free)
3. Create a free M0 cluster
4. Create a database user (username/password)
5. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/snapmail`)

### Step 2: Configure Backend

```powershell
cd backend

# Copy environment template
copy .env.example .env

# Edit .env with your MongoDB connection string
notepad .env
```

Update `.env`:
```
PORT=3001
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/snapmail
EMAIL_DOMAIN=snapmail.local
```

### Step 3: Start Backend

```powershell
cd backend
npm install
npm start
```

### Step 4: Update Frontend

```powershell
cd ..
node update-frontend.js
```

### Step 5: Start Frontend

```powershell
python -m http.server 8000
```

### Step 6: Open in Browser

Go to: http://localhost:8000

---

## 🌐 Deployment to DigitalOcean (Production)

### Step 1: Claim DigitalOcean Credits

1. Go to [GitHub Student Pack](https://education.github.com/pack)
2. Claim DigitalOcean offer ($200 credits)
3. Connect GitHub account

### Step 2: Push to GitHub

```powershell
cd backend
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/snapmail-backend.git
git push -u origin main
```

### Step 3: Deploy on DigitalOcean App Platform

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Connect your GitHub repo
4. Add environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `EMAIL_DOMAIN`: Your Testmail namespace (e.g., `abc123.testmail.app`)
5. Deploy!

### Step 4: Update Frontend

Edit `update-frontend.js`:
```javascript
const YOUR_BACKEND_URL = 'https://your-app-xxxxx.ondigitalocean.app';
```

Run:
```powershell
node update-frontend.js
```

### Step 5: Deploy Frontend

Host the frontend files on GitHub Pages:
1. Create a new repo for frontend
2. Push `index.html` and `static/` folder
3. Enable GitHub Pages in repo settings

---

## 📬 Setting Up Real Email Receiving (Testmail.app)

### Step 1: Claim Testmail Offer

1. Go to [GitHub Student Pack](https://education.github.com/pack)
2. Claim Testmail.app Essential plan (free)
3. Get your namespace (e.g., `abc123`)

### Step 2: Configure Backend

Update `.env`:
```
EMAIL_DOMAIN=abc123.testmail.app
```

### Step 3: Set Up Webhook

In Testmail.app dashboard:
1. Go to Settings → Webhooks
2. Add webhook URL: `https://your-backend.ondigitalocean.app/api/webhook/testmail`
3. Enable "New Email" events

### How It Works

1. User generates email: `random123@abc123.testmail.app`
2. Someone sends email to that address
3. Testmail receives it → sends webhook to your backend
4. Backend stores in MongoDB
5. Frontend polls for new emails every 5 seconds

---

## 💰 Cost Breakdown (All Free!)

| Service | Cost | Credits Available |
|---------|------|-------------------|
| MongoDB Atlas | $0 | $50 free credits |
| DigitalOcean | ~$5/mo | $200 credits (40 months!) |
| Testmail.app | $0 | Free Essential plan |
| GitHub Pages | $0 | Free forever |
| **Total** | **$0** | ✅ |

---

## 📡 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mailbox/create` | POST | Create new mailbox |
| `/api/mailbox/:email` | GET | Get mailbox info |
| `/api/mailbox/:email/emails` | GET | List emails |
| `/api/mailbox/:email/refresh` | POST | Extend timer |
| `/api/mailbox/:email` | DELETE | Delete mailbox |
| `/api/email/:id` | GET | Get email details |
| `/api/webhook/testmail` | POST | Receive emails |

---

## 🔧 Troubleshooting

### "Cannot connect to MongoDB"
- Check your connection string in `.env`
- Make sure your IP is whitelisted in MongoDB Atlas (Network Access)
- Try `0.0.0.0/0` to allow all IPs (for testing)

### "Frontend not loading"
- Make sure backend is running on port 3001
- Run `node update-frontend.js` to update the API URL
- Check browser console for CORS errors

### "Emails not appearing"
- Check Testmail webhook is configured correctly
- Verify EMAIL_DOMAIN matches your Testmail namespace
- Check backend logs for webhook errors

---

## 📝 License

MIT - Use freely for your projects!

---

Made with ❤️ using GitHub Student Developer Pack
