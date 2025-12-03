# SnapMail Backend

A Node.js backend for the SnapMail temporary email service.

## Features

- ✅ Create temporary email addresses
- ✅ Auto-expire mailboxes after 10 minutes
- ✅ Receive emails via Testmail.app webhook
- ✅ Generate test emails
- ✅ MongoDB storage

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy the example environment file and edit it:

```bash
cp .env.example .env
```

Edit `.env` with your values:
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `EMAIL_DOMAIN`: Your Testmail.app namespace (e.g., `abc123.testmail.app`)

### 3. Run the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mailbox/create` | Create new temporary mailbox |
| GET | `/api/mailbox/:email` | Get mailbox info |
| GET | `/api/mailbox/:email/emails` | Get emails for mailbox |
| POST | `/api/mailbox/:email/refresh` | Extend mailbox timer |
| DELETE | `/api/mailbox/:email` | Delete mailbox |
| POST | `/api/mailbox/:email/generate-email` | Generate test email |
| GET | `/api/email/:id` | Get single email details |
| POST | `/api/webhook/testmail` | Testmail.app webhook endpoint |

## Deployment to DigitalOcean

### Option 1: App Platform (Easiest)

1. Push code to GitHub
2. Go to DigitalOcean App Platform
3. Connect your GitHub repo
4. Set environment variables
5. Deploy!

### Option 2: Droplet

1. Create a droplet (Ubuntu 22.04, $6/mo)
2. SSH into the droplet
3. Install Node.js 18+
4. Clone your repo
5. Run with PM2:

```bash
npm install -g pm2
pm2 start server.js --name snapmail
pm2 save
pm2 startup
```

## Setting Up Testmail.app

1. Sign up at [testmail.app](https://testmail.app) with GitHub Student Pack
2. Get your namespace (e.g., `abc123`)
3. Your email domain will be: `abc123.testmail.app`
4. Set up webhook to point to: `https://your-backend-url.com/api/webhook/testmail`

## MongoDB Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Claim GitHub Student Pack credits ($50)
3. Create a free cluster
4. Get connection string
5. Add to `.env`

## License

MIT
