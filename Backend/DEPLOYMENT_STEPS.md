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
HOST=0.0.0.0
PUBLIC_BACKEND_URL=http://<EC2_PUBLIC_IP>:8787
CORS_ORIGINS=http://<your-s3-website-endpoint>,https://<your-cloudfront-domain>,http://localhost:5173
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
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

**If data inserts but select/read fails from backend:**
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set on EC2 (required for backend service reads when RLS blocks anon key)
- Rebuild and restart backend so updated env is applied: `npm run build && pm2 restart cep-backend`
- Check logs for warning `SUPABASE_SERVICE_ROLE_KEY not set`

**If frontend shows `ERR_CONNECTION_RESET` to `<EC2_IP>:8787`:**
- Verify app is listening on all interfaces: `HOST=0.0.0.0`
- Verify process is running: `pm2 status` and `pm2 logs cep-backend --lines 100`
- Verify backend locally on EC2: `curl http://localhost:8787/`
- Verify backend via public IP from EC2: `curl http://<EC2_PUBLIC_IP>:8787/`
- Open EC2 Security Group inbound rule for custom TCP `8787` from your required source (temporary test: `0.0.0.0/0`)
- If UFW is enabled: `sudo ufw allow 8787/tcp`

**If S3 frontend shows `404 Not Found` on page refresh:**
- In S3 static website hosting, set both `Index document` and `Error document` to `index.html` for SPA routing
- Re-upload the latest `dist` contents to S3

**If frontend still calls the wrong backend URL:**
- Confirm `Frontend/.env` has `VITE_APP_BACKEND_BASE_URL=http://<EC2_PUBLIC_IP>:8787`
- Rebuild frontend after env changes: `npm run build`
- Upload fresh `dist` files to S3 (old bundles keep old env values)

**To stop the server:**
```bash
pm2 stop cep-backend
```

