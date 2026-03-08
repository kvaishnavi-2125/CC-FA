# Deployment Steps for CEP Backend on EC2

## On Local Machine (Windows)

1. **Build the project locally:**
   ```bash
   npm run build
   ```

2. **Commit and push changes:**
   ```bash
   git add .
   git commit -m "Build dist folder"
   git push origin main
   ```

## On EC2 Instance (Ubuntu)

1. **Navigate to project directory:**
   ```bash
   cd ~/CEP_Project/cep-backend
   ```

2. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the application:**
   ```bash
   npm start
   ```
   
   This will run: `node dist/index.js`

## Environment Variables

Create a `.env` file in the `/home/ubuntu/CEP_Project/cep-backend` directory with:
```
PORT=8787
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
FRONTEND_URL=your_frontend_url
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
GEMINI_API_KEY=your_gemini_key
RESEND_API_KEY=your_resend_key
```

## Running in Background with PM2 (Recommended)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the app with PM2
pm2 start "npm start" --name "cep-backend"

# Make it restart on reboot
pm2 startup
pm2 save

# View logs
pm2 logs cep-backend
```

## Troubleshooting

**If dist folder is missing:**
- Ensure `npm run build` was run locally
- Check that the Git push included the dist folder
- Do: `git pull origin main` to get the latest dist

**If modules not found:**
- Run: `npm install`
- Verify all .env variables are set

**To stop the server:**
```bash
pm2 stop cep-backend
```
