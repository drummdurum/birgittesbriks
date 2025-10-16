# Birgittes Briks - Railway Deployment Guide

## 🚀 Deploy til Railway

### Prerequisites
1. Railway account (railway.app)
2. GitHub repository med projektet
3. Email konfiguration (Gmail med App Password anbefales)

### Step 1: Opret Railway Projekt
```bash
# Installer Railway CLI
npm install -g @railway/cli

# Login til Railway
railway login

# Deploy projektet
railway deploy
```

### Step 2: Tilføj PostgreSQL Database
1. Gå til Railway dashboard
2. Klik "Add Service" → "Database" → "PostgreSQL"
3. Database URL bliver automatisk sat som `DATABASE_URL` environment variable

### Step 3: Konfigurer Environment Variables
Sæt følgende variabler i Railway dashboard:

```env
NODE_ENV=production
SESSION_SECRET=din_super_sikre_session_nøgle_her_mindst_32_tegn
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=din@gmail.com
SMTP_PASS=din_gmail_app_password
FROM_EMAIL=birgittesbriks@gmail.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=3
```

### Step 4: Setup Gmail App Password
1. Gå til Google Account settings
2. Security → 2-Step Verification (skal være aktiveret)
3. App passwords → Generate password for "Mail"
4. Brug dette password som `SMTP_PASS`

### Step 5: Initialize Database
Efter deployment, kør database initialization:
```bash
railway run npm run db:init
```

### Step 6: Custom Domain (Valgfrit)
1. I Railway dashboard → Settings → Domains
2. Tilføj dit eget domain
3. Opdater DNS records som vist

## 🔧 Lokalt Development Setup

### Database Setup (Local PostgreSQL)
```bash
# Installer PostgreSQL lokalt
# Windows: Download fra postgresql.org
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql

# Opret database
createdb birgittesbriks_dev

# Kør database initialization
npm run db:init
```

### Environment Variables (.env)
```env
DATABASE_URL=postgresql://username:password@localhost:5432/birgittesbriks_dev
NODE_ENV=development
SESSION_SECRET=development_secret_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=din@gmail.com
SMTP_PASS=din_gmail_app_password
FROM_EMAIL=birgittesbriks@gmail.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5
```

### Kør Development Server
```bash
npm install
npm run build-css
npm run dev
```

## 📧 Email Testing
Test email funktionalitet lokalt:
```bash
# Send test booking for at verificere email setup
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "navn": "Test Bruger",
    "email": "test@example.com",
    "telefon": "12345678",
    "behandling_type": "Enkelt behandling",
    "gdpr_samtykke": "true"
  }'
```

## 🛡️ Sikkerhed
- Rate limiting: 3 booking forespørgsler per 15 minutter
- Input validation på alle felter
- GDPR compliance med samtykke checkbox
- Secure session cookies i production
- Helmet.js for HTTP headers sikkerhed
- CORS konfiguration

## 📊 Monitoring
- Health check endpoint: `/health`
- Server logs tilgængelige via Railway CLI
- Database connection monitoring

## 🔄 Deployment Workflow
1. Push til GitHub main branch
2. Railway deployer automatisk
3. Database migrations køres hvis nødvendigt
4. Health check verificerer deployment

## 📞 Support Kontakt
Ved problemer med deployment:
- Check Railway logs: `railway logs`
- Verificer environment variables
- Test database forbindelse: `/health` endpoint