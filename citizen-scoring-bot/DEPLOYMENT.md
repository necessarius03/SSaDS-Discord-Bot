# Deployment Guide

## Option 1: Render (Primary)

### Prerequisites
1. GitHub account with your code pushed
2. Discord Bot Token and Client ID

### Steps
1. **Create Render Account:**
   - Go to render.com
   - Sign up with GitHub (no credit card required initially)

2. **Create Database:**
   - Click "New PostgreSQL"
   - Name: `ssads-discord-bot-db`
   - Free tier is sufficient

3. **Create Web Service:**
   - Click "New Web Service"
   - Connect your GitHub repository
   - Choose `citizen-scoring-bot` folder
   - Render will auto-detect the `render.yaml`

4. **Set Environment Variables:**
   ```
   DISCORD_TOKEN=your_bot_token_here
   DISCORD_CLIENT_ID=your_client_id_here
   DATABASE_URL=postgresql://... (auto-generated)
   ```

5. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)

### Health Check URL
`https://your-app-name.onrender.com/health`

## Option 2: Railway (Backup)

### Prerequisites
1. GitHub account
2. Discord Bot Token and Client ID

### Steps
1. **Create Railway Account:**
   - Go to railway.app
   - Sign up with GitHub
   - Get $5 free credits monthly

2. **Create New Project:**
   - Click "New Project"
   - Deploy from GitHub repo
   - Select `citizen-scoring-bot` folder

3. **Add PostgreSQL:**
   - Click "Add Service" > "Database" > "PostgreSQL"
   - Railway auto-connects DATABASE_URL

4. **Set Environment Variables:**
   ```
   DISCORD_TOKEN=your_bot_token_here
   DISCORD_CLIENT_ID=your_client_id_here
   ```

5. **Deploy:**
   - Push to GitHub triggers auto-deploy
   - Check logs for success

### Health Check URL
`https://your-app.railway.app/health`

## Option 3: Uptime Robot Monitoring

### Prerequisites
1. Working deployment on Render or Railway
2. Health check endpoint working

### Steps
1. **Create Uptime Robot Account:**
   - Go to uptimerobot.com
   - Free account: 50 monitors, 5-min checks

2. **Add Monitor:**
   - Type: HTTP(s)
   - URL: `https://your-app.com/health`
   - Name: "SSaDS Discord Bot"
   - Interval: 5 minutes

3. **Set Up Alerts:**
   - Email notifications
   - Optional: SMS (paid feature)
   - Webhook to Discord channel (optional)

## Testing Your Deployment

### 1. Check Health Endpoint
```bash
curl https://your-app.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "bot": "connected",
  "uptime": 123.45,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. Check Discord Bot
- Bot should appear online in your server
- Test slash commands
- Check database connectivity

### 3. Monitor Logs
- **Render:** Check "Logs" tab in dashboard
- **Railway:** Check deployment logs

## Troubleshooting

### Common Issues
1. **Bot not connecting:** Check DISCORD_TOKEN
2. **Database errors:** Verify DATABASE_URL
3. **Port issues:** Render/Railway handle PORT automatically
4. **Build failures:** Check npm scripts in package.json

### Commands for Debugging
```bash
# Test locally first
npm run dev

# Check build
npm run build

# Test production build
npm start
```

## Cost Breakdown

### Free Resources
- **Render:** 500 build hours/month, PostgreSQL included
- **Railway:** $5 free credits monthly
- **Uptime Robot:** 50 monitors free

### Paid Upgrades (Optional)
- **Render:** $7/month for always-on service
- **Railway:** Pay-per-usage after free credits
- **Uptime Robot:** $5/month for SMS alerts

## Best Practices

1. **Use both Render + Railway** for redundancy
2. **Monitor with Uptime Robot** on primary deployment
3. **Keep code in sync** between deployments
4. **Test locally** before deploying
5. **Check logs regularly** for issues