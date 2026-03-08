# Cloud Computing Assignment - Complete Implementation Guide

## 📋 Syllabus Coverage & Implementation Map

| Topic | Implementation | Status |
|-------|---|---|
| **VM Configuration** | EC2 Instance Setup | ✅ To-Do |
| **Storage Configuration** | S3 Buckets | ✅ Done |
| **Database Configuration** | RDS MySQL/PostgreSQL | ✅ To-Do |
| **Load Balancing** | AWS Application Load Balancer | ✅ To-Do |
| **Virtualization** | EC2 Instances | ✅ To-Do |
| **Containerization** | Docker Setup | ✅ To-Do |

---

## 🎯 TASK 1: VIRTUAL MACHINE ON AWS (EC2)

### Step 1: Create EC2 Instance
```bash
AWS Console → EC2 → Instances → Launch Instance

Configuration:
- AMI: Ubuntu Server 24.04 LTS (Free tier)
- Instance Type: t2.micro (Free tier eligible)
- Storage: 20 GB (Free tier)
- Security Group: 
  - SSH: Port 22 (Your IP)
  - HTTP: Port 80 (0.0.0.0/0)
  - HTTPS: Port 443 (0.0.0.0/0)
  - Custom: Port 3000 (0.0.0.0/0) for Backend
  - Custom: Port 5432 (0.0.0.0/0) for DB
```

### Step 2: Connect to EC2 Instance
```bash
# Download key pair (plant-management.pem)
chmod 400 plant-management.pem

# SSH into instance
ssh -i plant-management.pem ubuntu@<EC2_PUBLIC_IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install npm packages
node --version
npm --version
```

### Step 3: Deploy Backend on EC2
```bash
# Clone repository on EC2
git clone https://github.com/kvaishnavi-2125/CC-FA.git
cd CC-FA/Backend

# Install dependencies
npm install

# Create .env file with AWS credentials
touch .env
# Add:
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# Run backend
npm run dev
# Or for production:
npm run build && npm start
```

### Step 4: Use PM2 for Process Management
```bash
# Install PM2
sudo npm install -g pm2

# Start backend with PM2
pm2 start npm --name "plant-backend" -- start

# Make it start on reboot
pm2 startup
pm2 save

# Monitor
pm2 monit
pm2 logs plant-backend
```

### Step 5: Setup Nginx Reverse Proxy
```bash
# Install Nginx
sudo apt install -y nginx

# Create config file
sudo nano /etc/nginx/sites-available/default
```

Add this configuration:
```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Test and restart
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🗄️ TASK 2: STORAGE CONFIGURATION (S3 BUCKETS)

### ✅ Already Implemented Features in S3Service.ts:
- Upload files to S3 ✅
- Generate signed URLs ✅
- Delete files from S3 ✅

### Step 1: Create S3 Bucket
```bash
AWS Console → S3 → Create Bucket

Configuration:
- Bucket Name: plant-management-uploads
- Region: ap-south-1 (Asia Pacific Mumbai)
- Block Public Access: Enable
- Enable Versioning: Yes (for backup)
- Server-side Encryption: Enable
```

### Step 2: Create Bucket Folders
```bash
# Using AWS CLI
aws s3api put-object --bucket plant-management-uploads --key plants/
aws s3api put-object --bucket plant-management-uploads --key users/
aws s3api put-object --bucket plant-management-uploads --key documents/
aws s3api put-object --bucket plant-management-uploads --key backups/
```

### Step 3: CRUD Operations Testing

**CREATE (Upload):**
```typescript
// Already implemented in Backend/src/services/S3Service.ts
import { uploadToS3 } from './S3Service';

const response = await uploadToS3(fileBuffer, 'image.jpg', 'plants');
// Returns: { url, key, bucket }
```

**READ (Download with Signed URL):**
```typescript
import { getSignedS3Url } from './S3Service';

const signedUrl = await getSignedS3Url('plants/12345-image.jpg', 3600);
// Returns temporary URL valid for 1 hour
```

**UPDATE (Replace):**
```typescript
// Delete old file then upload new
await deleteFromS3(oldKey);
await uploadToS3(newFileBuffer, 'image.jpg', 'plants');
```

**DELETE:**
```typescript
import { deleteFromS3 } from './S3Service';

await deleteFromS3('plants/12345-image.jpg');
```

### Step 4: Configure Bucket Policies
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3Access",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_IAM_USER"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::plant-management-uploads",
        "arn:aws:s3:::plant-management-uploads/*"
      ]
    }
  ]
}
```

### Step 5: Enable Lifecycle Policies (Auto-delete old files)
```
AWS S3 → plant-management-uploads → Management → Lifecycle rules

Rule 1: Delete old backups
- Prefix: backups/
- Status: Enabled
- Action: Permanently delete after 30 days

Rule 2: Move old uploads to Glacier
- Prefix: uploads/
- Action: Transition to Glacier after 90 days
```

---

## 🗄️ TASK 3: DATABASE CONFIGURATION (RDS)

### Step 1: Create RDS Instance
```bash
AWS Console → RDS → Create Database

Configuration:
- Engine: MySQL 8.0 (or PostgreSQL)
- Free Tier: Yes
- DB Instance Identifier: plant-management-db
- Master Username: admin
- Master Password: Strong_Password_123
- Instance Class: db.t4g.micro (Free tier)
- Storage: 20 GB
- Allocated Storage Type: gp3
- Backup: 7 days
- Multi-AZ: No (Free tier)
```

### Step 2: Configure Security Group
```
Inbound Rules:
- Type: MySQL/Aurora
- Protocol: TCP
- Port: 3306
- Source: EC2 Security Group or Specific IP
```

### Step 3: Create Database Schema

**Connect to RDS:**
```bash
# Install MySQL client
sudo apt install -y mysql-client

# Connect to RDS
mysql -h plant-management-db.xxxxx.ap-south-1.rds.amazonaws.com \
      -u admin -p
```

**Create Tables:**
```sql
CREATE DATABASE plant_management;
USE plant_management;

-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    profile_image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Plants Table
CREATE TABLE plants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    species VARCHAR(255),
    description TEXT,
    image_url VARCHAR(255),
    location VARCHAR(255),
    watering_frequency INT,
    sunlight_requirement VARCHAR(100),
    temperature_range VARCHAR(100),
    humidity_level VARCHAR(100),
    fertilizer_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Plant Care Logs Table
CREATE TABLE care_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plant_id INT NOT NULL,
    care_type ENUM('watering', 'fertilizing', 'pruning', 'repotting') NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE,
    INDEX idx_plant_id (plant_id)
);

-- Favorites Table
CREATE TABLE favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (user_id, plant_id)
);

-- Notifications Table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plant_id INT,
    type VARCHAR(100),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);
```

### Step 4: Create RDS Service in Backend

Create [Backend/src/services/RDSService.ts](Backend/src/services/RDSService.ts):
```typescript
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.RDS_HOST,
  user: process.env.RDS_USER,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// User CRUD Operations
export async function createUser(email: string, passwordHash: string, fullName: string) {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(
      'INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)',
      [email, passwordHash, fullName]
    );
    return result;
  } finally {
    connection.release();
  }
}

export async function getUserById(userId: number) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, email, full_name, profile_image_url, created_at FROM users WHERE id = ?',
      [userId]
    );
    return rows[0];
  } finally {
    connection.release();
  }
}

export async function createPlant(plantData: any) {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(
      `INSERT INTO plants 
       (user_id, name, species, description, image_url, location, watering_frequency) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [plantData.userId, plantData.name, plantData.species, plantData.description, 
       plantData.imageUrl, plantData.location, plantData.wateringFrequency]
    );
    return result;
  } finally {
    connection.release();
  }
}

export async function getUserPlants(userId: number) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM plants WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  } finally {
    connection.release();
  }
}

export async function addCareLog(plantId: number, careType: string, notes: string) {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(
      'INSERT INTO care_logs (plant_id, care_type, date, notes) VALUES (?, ?, CURDATE(), ?)',
      [plantId, careType, notes]
    );
    return result;
  } finally {
    connection.release();
  }
}

export async function deletePlant(plantId: number) {
  const connection = await pool.getConnection();
  try {
    await connection.execute('DELETE FROM plants WHERE id = ?', [plantId]);
  } finally {
    connection.release();
  }
}

export async function closePool() {
  await pool.end();
}
```

### Step 5: Update Environment Variables

Add to Backend/.env:
```
RDS_HOST=plant-management-db.xxxxx.ap-south-1.rds.amazonaws.com
RDS_USER=admin
RDS_PASSWORD=Strong_Password_123
RDS_DATABASE=plant_management
RDS_PORT=3306
```

### Step 6: Create API Routes

Create [Backend/src/routes/plants.ts](Backend/src/routes/plants.ts):
```typescript
import express from 'express';
import { createPlant, getUserPlants, deletePlant, addCareLog } from '../services/RDSService';
import { uploadToS3 } from '../services/S3Service';

const router = express.Router();

// Get all plants for user
router.get('/:userId', async (req, res) => {
  try {
    const plants = await getUserPlants(Number(req.params.userId));
    res.json(plants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plants' });
  }
});

// Create new plant
router.post('/', async (req, res) => {
  try {
    let imageUrl = '';
    if (req.body.imageBuffer) {
      const uploadResult = await uploadToS3(req.body.imageBuffer, req.body.imageName, 'plants');
      imageUrl = uploadResult.url;
    }

    const result = await createPlant({
      ...req.body,
      imageUrl
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create plant' });
  }
});

// Add care log
router.post('/:plantId/care', async (req, res) => {
  try {
    const result = await addCareLog(
      Number(req.params.plantId),
      req.body.careType,
      req.body.notes
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add care log' });
  }
});

// Delete plant
router.delete('/:plantId', async (req, res) => {
  try {
    await deletePlant(Number(req.params.plantId));
    res.json({ message: 'Plant deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete plant' });
  }
});

export default router;
```

---

## 🌟 EXTRA FEATURES TO GET GOOD MARKS

### 1. Load Balancing with AWS Application Load Balancer
```
AWS → EC2 → Load Balancers → Create ALB

Benefits:
- Distribute traffic across multiple EC2 instances
- High availability
- Auto-scaling with multiple backends
```

**Implementation:**
```bash
# Create Launch Template
# Deploy multiple EC2 instances
# Attach to ALB
# Configure health checks
```

### 2. Auto-Scaling Group
```json
{
  "MinSize": 1,
  "MaxSize": 3,
  "DesiredCapacity": 2,
  "HealthCheckType": "ELB",
  "HealthCheckGracePeriod": 300
}
```

### 3. CloudWatch Monitoring & Alarms
```bash
# Monitor CPU, Memory, Network
# Create alarms for high CPU (>80%)
# Log application errors to CloudWatch
```

**Add to Backend:**
```typescript
import AWS from 'aws-sdk';

const cloudwatch = new AWS.CloudWatch();

export async function logMetric(metricName: string, value: number) {
  await cloudwatch.putMetricData({
    Namespace: 'PlantManagement',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: 'Count',
      Timestamp: new Date()
    }]
  }).promise();
}
```

### 4. RDS Backup & Recovery
```sql
-- Enable automated backups (already set to 7 days)
-- Create manual snapshots before major updates
-- Test recovery procedures
```

### 5. VPC Creation & Security
```bash
# Create custom VPC
# Create private subnets for database
# Create public subnets for web servers
# Use NAT Gateway for egress traffic
# Configure network ACLs
```

### 6. Docker Containerization
Create [Backend/Dockerfile](Backend/Dockerfile):
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

Create [docker-compose.yml](docker-compose.yml):
```yaml
version: '3.8'

services:
  backend:
    build: ./Backend
    ports:
      - "3000:3000"
    environment:
      - AWS_REGION=ap-south-1
      - RDS_HOST=rds-endpoint
    depends_on:
      - mysql

  frontend:
    build: ./Frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: plant_management
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

volumes:
  mysql_data:
```

### 7. Caching with ElastiCache
```bash
# Add Redis for session management
# Cache frequently accessed plant data
# Reduce RDS load
```

### 8. CDN Integration with CloudFront
```bash
# Create CloudFront distribution
# Point to S3 bucket for images
# Reduce latency globally
# Enable edge caching
```

### 9. Infrastructure as Code (Terraform)
Create [infrastructure/main.tf](infrastructure/main.tf):
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-south-1"
}

# EC2 Instance
resource "aws_instance" "plant_backend" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  tags = {
    Name = "plant-management-backend"
  }
}

# S3 Bucket
resource "aws_s3_bucket" "plant_uploads" {
  bucket = "plant-management-uploads"
}

# RDS Database
resource "aws_db_instance" "plant_database" {
  identifier     = "plant-management-db"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"
  allocated_storage = 20
}
```

### 10. CI/CD Pipeline
Create [.github/workflows/deploy.yml](.github/workflows/deploy.yml):
```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Docker images
        run: docker-compose build
      
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker push $ECR_REGISTRY/plant-management:latest
      
      - name: Deploy to EC2
        run: |
          ssh -i ${{ secrets.EC2_KEY }} ubuntu@$EC2_HOST 'docker pull ... && docker-compose up -d'
```

---

## 📊 Documentation to Include

Create a [DEPLOYMENT.md](DEPLOYMENT.md) file with:

1. **Architecture Diagram**
   - Frontend → CloudFront → ALB → EC2 instances
   - EC2 → RDS (private subnet)
   - EC2 → S3 (for image storage)

2. **Cost Breakdown**
   - EC2: $0 (Free tier)
   - RDS: $0 (Free tier for 12 months)
   - S3: $0.023 per GB (first 1GB free)

3. **Performance Metrics**
   - Response times
   - Database query performance
   - S3 upload/download speeds

4. **Security Considerations**
   - IAM roles and policies
   - VPC security groups
   - Encryption in transit and at rest

---

## 🚀 Quick Start Commands

```bash
# Deploy Backend
cd Backend
npm install
npm run build
npm start

# Deploy with PM2
pm2 start npm --name backend -- start

# Database Setup
mysql -h <RDS_ENDPOINT> -u admin -p < schema.sql

# Test S3
curl -X POST http://localhost:3000/api/upload -F "file=@test.jpg" -F "folder=plants"

# Test RDS
curl http://localhost:3000/api/plants/1
```

---

## 📝 Submission Checklist

- [ ] EC2 instance deployed and accessible
- [ ] S3 CRUD operations working
- [ ] RDS database created with schema
- [ ] Backend connected to EC2
- [ ] API endpoints documented
- [ ] Load balancer configured (bonus)
- [ ] Docker setup complete (bonus)
- [ ] Monitoring & alerts configured (bonus)
- [ ] Infrastructure as Code (bonus)
- [ ] CI/CD pipeline (bonus)
- [ ] Documentation complete
- [ ] GitHub repo updated with all code

---

**Keep this for reference in your GitHub repo!**
