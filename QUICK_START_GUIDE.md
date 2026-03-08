# Quick Implementation Steps - Cloud Computing Assignment

## 🚀 Phase 1: Local Development Setup (Days 1-2)

### 1.1 Clone & Setup Backend
```bash
cd Backend
npm install
cp .env.template .env
# Edit .env with your AWS credentials (if available) or leave as local
```

### 1.2 Database Setup (Local MySQL)
```bash
# Install MySQL locally or use Docker
docker run --name plant-db -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=plant_management -p 3306:3306 -d mysql:8.0

# Apply schema
mysql -h localhost -u root -p plant_management < Backend/scripts/init-db.sql
```

### 1.3 Update Backend .env
```
RDS_HOST=localhost
RDS_USER=root
RDS_PASSWORD=root
RDS_DATABASE=plant_management
AWS_REGION=ap-south-1
```

### 1.4 Test Backend
```bash
cd Backend
npm run dev
# Should run on http://localhost:3000
```

---

## 🎯 Phase 2: AWS EC2 & S3 Setup (Days 3-4)

### 2.1 Create AWS Account & Get Credentials
- Create AWS Free Tier Account
- Create IAM User with S3 and EC2 permissions
- Generate Access Key ID and Secret Key
- Download EC2 Key Pair (plant-management.pem)

### 2.2 Launch EC2 Instance
```
AWS Console Steps:
1. EC2 Dashboard → Launch Instance
2. Select: Ubuntu Server 24.04 LTS (Free tier)
3. Instance Type: t2.micro
4. Storage: 20GB
5. Security Group:
   - SSH (22): Your IP only
   - HTTP (80): 0.0.0.0/0
   - HTTPS (443): 0.0.0.0/0
   - Custom TCP (3000): 0.0.0.0/0
6. Review & Launch
7. Select key pair: plant-management.pem
```

### 2.3 Connect to EC2
```bash
chmod 400 plant-management.pem
ssh -i plant-management.pem ubuntu@<EC2_PUBLIC_IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js & npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt install -y git
```

### 2.4 Deploy Backend to EC2
```bash
# On EC2
git clone https://github.com/kvaishnavi-2125/CC-FA.git
cd CC-FA/Backend
npm install

# Create .env with AWS credentials
nano .env
# Paste your AWS credentials

npm run build
npm start
```

### 2.5 Create S3 Bucket
```
AWS Console Steps:
1. S3 → Create Bucket
2. Name: plant-management-uploads (must be unique)
3. Region: ap-south-1
4. Block public access: ON
5. Enable versioning: ON
6. Encryption: Enable default
7. Create folders: plants/, users/, documents/
```

### 2.6 Update Backend .env with S3
```
AWS_S3_BUCKET=plant-management-uploads
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

---

## 📊 Phase 3: RDS Database Setup (Days 5-6)

### 3.1 Create RDS Instance
```
AWS Console Steps:
1. RDS → Create Database
2. Engine: MySQL 8.0
3. Free Tier: Check "Free tier eligible"
4. DB Instance Identifier: plant-management-db
5. Master Username: admin
6. Master Password: BackupPassword123 (strong!)
7. Instance Class: db.t4g.micro
8. Storage: 20GB gp3
9. Public Accessibility: No (use EC2 security group)
10. Backup: 7 days
11. Create Database
```

### 3.2 Configure RDS Security Group
```
Inbound Rules:
- Type: MySQL/Aurora
- Protocol: TCP
- Port: 3306
- Source: EC2 Security Group OR 0.0.0.0/0 (for testing)
```

### 3.3 Connect & Initialize RDS
```bash
# From EC2
mysql -h plant-management-db.xxxxx.ap-south-1.rds.amazonaws.com \
      -u admin -p

# Paste password when prompted
# Then execute SQL from Backend/scripts/init-db.sql
source /path/to/init-db.sql
```

### 3.4 Update Backend .env with RDS
```
RDS_HOST=plant-management-db.xxxxx.ap-south-1.rds.amazonaws.com
RDS_USER=admin
RDS_PASSWORD=BackupPassword123
RDS_DATABASE=plant_management
```

### 3.5 Test RDS Connection
```bash
cd Backend
npm run dev
# Check if it connects to RDS successfully
```

---

## 🐳 Phase 4: Containerization & Deployment (Days 7-8)

### 4.1 Local Docker Testing
```bash
# From project root
docker-compose up -d

# Check if all services are running
docker-compose ps

# Test API
curl http://localhost:3000/api/health
```

### 4.2 Push to DockerHub (Optional but good for marks)
```bash
# Create DockerHub account
docker login

# Build and tag
docker build -t kvaishnavi/plant-backend:latest ./Backend
docker tag kvaishnavi/plant-backend:latest kvaishnavi/plant-backend:1.0

# Push
docker push kvaishnavi/plant-backend:latest
docker push kvaishnavi/plant-backend:1.0
```

### 4.3 Deploy Docker on EC2
```bash
# SSH into EC2
ssh -i plant-management.pem ubuntu@<EC2_IP>

# Install Docker
sudo apt install -y docker.io docker-compose

# Clone repo
git clone https://github.com/kvaishnavi-2125/CC-FA.git
cd CC-FA

# Create .env for production
nano .env

# Start services
sudo docker-compose up -d

# Monitor logs
sudo docker-compose logs -f backend
```

---

## ✅ Phase 5: Testing & Validation (Days 9)

### 5.1 Test All CRUD Operations

**S3 Operations:**
```bash
# Upload
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test-image.jpg" \
  -F "folder=plants"

# Delete
curl -X DELETE http://localhost:3000/api/delete \
  -d "key=plants/12345-test.jpg"
```

**RDS Operations:**
```bash
# Create User
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'

# Get Plants
curl http://localhost:3000/api/plants?userId=1

# Create Plant
curl -X POST http://localhost:3000/api/plants \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"name":"Rose","species":"Rosa"}'
```

### 5.2 Performance Testing
```bash
# Install Apache Bench
sudo apt install -y apache2-utils

# Load test
ab -n 100 -c 10 http://localhost:3000/api/health
```

---

## 📋 Phase 6: Documentation & Submission (Days 10)

### 6.1 Create Architecture Diagram
Document in [DEPLOYMENT.md](../DEPLOYMENT.md):
```
┌─────────────────────────────────────────────────────┐
│                    Users/Clients                     │
└──────────────────────┬──────────────────────────────┘
                       │ (HTTPS)
┌──────────────────────▼──────────────────────────────┐
│          AWS Application Load Balancer              │
│         (Multiple AZs, Health Checks)               │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼────┐    ┌────▼────┐   ┌────▼────┐
   │   EC2   │ ── │   EC2   │ ──│   EC2   │
   │Backend  │    │Backend  │   │Backend  │
   └────┬────┘    └────┬────┘   └────┬────┘
        │              │              │
        └──────────────┼──────────────┘
                       │ (Private VPC)
        ┌──────────────▼──────────────┐
        │      RDS MySQL (Multi-AZ)   │
        │   Plant Management Database │
        └─────────────────────────────┘
        
        ┌─────────────────────────────┐
        │   S3 Bucket (Images Store)  │
        │  plant-management-uploads   │
        └─────────────────────────────┘
```

### 6.2 Screenshots to Include
1. ✅ EC2 Instance Running
2. ✅ S3 Bucket with Objects
3. ✅ RDS Database Connected
4. ✅ API Response from EC2
5. ✅ Application Load Balancer (if setup)
6. ✅ CloudWatch Metrics (if setup)

### 6.3 Create Submission Report
Include in project root:

**SUBMISSION.md:**
```markdown
# Cloud Computing Assignment - Submission Report

## Student Details
- Name: Vaishnavi Kadam
- Enrollment: [Your enrollment number]
- Date: [Submission date]

## Task Completion

### Task 1: Virtual Machine on AWS ✅
- EC2 Instance Created: Yes
- Public IP: [Your IP]
- Operating System: Ubuntu 24.04 LTS
- Instance Type: t2.micro
- Backend Deployed: Yes
- Status: Running

### Task 2: Storage Configuration ✅
- S3 Bucket Created: plant-management-uploads
- CRUD Operations Implemented: Yes
  - CREATE (Upload): ✅
  - READ (Download/Signed URL): ✅
  - UPDATE (Replace): ✅
  - DELETE: ✅
- Encryption: Enabled
- Versioning: Enabled

### Task 3: Database Configuration ✅
- RDS Instance Created: Yes
- Database Engine: MySQL 8.0
- Database Name: plant_management
- Tables Created: 7
  - users
  - plants
  - care_logs
  - favorites
  - notifications
  - plant_categories
  - growth_records

## Extra Features Implemented
- [ ] Load Balancer Configuration
- [ ] Auto-Scaling Group
- [ ] CloudWatch Monitoring
- [ ] Docker Containerization
- [ ] CI/CD Pipeline
- [ ] VPC Setup
- [ ] RDS Backup Strategy
- [ ] ElastiCache Redis
- [ ] CloudFront CDN
- [ ] Terraform Infrastructure

## API Endpoints
- GET /api/plants - Get all plants
- POST /api/plants - Create new plant
- POST /api/upload - Upload to S3
- GET /api/users/:id - Get user details

## Performance Metrics
- Average Response Time: [X] ms
- Database Query Time: [X] ms
- S3 Upload Speed: [X] MB/s

## Conclusion
All three main tasks completed successfully. The application is now deployed on AWS cloud infrastructure with proper storage and database services.
```

---

## 🎓 Grading Checklist

| Item | Status | Evidence |
|------|--------|----------|
| EC2 Instance | ✅ | Screenshot of running instance |
| S3 Bucket Setup | ✅ | Screenshot of bucket with objects |
| S3 CRUD Ops | ✅ | Code + Test results |
| RDS Database | ✅ | Screenshot of database connected |
| RDS Tables | ✅ | SQL schema + screenshot |
| Backend Deployed | ✅ | Screenshot of running app |  
| Documentation | ✅ | Deployment guide |
| Extra Features | ⭐⭐⭐ | Docker + CI/CD + Monitoring |

---

## 🔗 Useful Links

- [AWS Free Tier](https://aws.amazon.com/free)
- [AWS S3 Pricing](https://aws.amazon.com/s3/pricing)
- [RDS MySQL Docs](https://docs.aws.amazon.com/RDS/latest/UserGuide/MySQL.Concepts.html)
- [EC2 Best Practices](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-best-practices.html)

---

## 🆘 Troubleshooting

### EC2 Connection Issues
```bash
# Check security group
# Ensure SSH (22) is open to your IP

# If key pair lost
# Create new key pair and relaunch instance
```

### RDS Connection Failed
```bash
# Check security group allows port 3306
# Verify credentials in .env
# Test from EC2: mysql -h <RDS_ENDPOINT> -u admin -p
```

### S3 Upload Errors
```bash
# Check IAM permissions
# Verify bucket name is correct
# Check AWS credentials in .env
```

### Docker Issues
```bash
# Check if Docker is running
sudo systemctl start docker

# View logs
docker-compose logs -f

# Rebuild containers
docker-compose down
docker-compose up --build
```

---

**Good Luck with your submission! 🚀**
