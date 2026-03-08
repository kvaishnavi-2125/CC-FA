# ⚡ Cloud Computing Assignment - Quick Reference Card

## 🎯 3 Main Tasks

### TASK 1: EC2 Virtual Machine
```
1. Go to AWS EC2 Console
2. Click "Launch Instance"
3. Choose: Ubuntu 24.04 LTS (Free tier)
4. Instance Type: t2.micro
5. Storage: 20GB
6. Security Group:
   - SSH (22): Your IP
   - HTTP (80): 0.0.0.0/0
   - Custom (3000): 0.0.0.0/0
7. Launch & download key pair

Connect:
ssh -i key.pem ubuntu@<PUBLIC_IP>

Deploy Backend:
git clone <repo>
cd Backend && npm install
npm run build && npm start
```

### TASK 2: S3 Bucket (Storage)
```
✅ Already Implemented!

Just create bucket in AWS Console:
1. S3 → Create Bucket
2. Name: plant-management-uploads
3. Block Public Access: ON
4. Versioning: ON
5. Encryption: ON

Test CRUD:
- CREATE: uploadToS3()
- READ: getSignedS3Url()
- UPDATE: delete + upload
- DELETE: deleteFromS3()
```

### TASK 3: RDS Database
```
1. RDS → Create Database
2. MySQL 8.0
3. DB Identifier: plant-management-db
4. Username: admin
5. Password: Strong_Pass_123
6. Instance: db.t4g.micro
7. Storage: 20GB

Update .env:
RDS_HOST=endpoint.rds.amazonaws.com
RDS_USER=admin
RDS_PASSWORD=Strong_Pass_123
RDS_DATABASE=plant_management

Tables Created: 7 ✅
- users
- plants
- care_logs
- favorites
- notifications
- plant_categories
- growth_records
```

---

## 💻 Essential Commands

```bash
# Local Development (Docker)
docker-compose up -d          # Start all services
docker-compose logs -f        # View logs
docker-compose down           # Stop all services
docker-compose ps             # Check status

# Backend
cd Backend
npm install                   # Install dependencies
npm run dev                   # Development mode
npm run build && npm start    # Production

# Database
mysql -h <RDS_ENDPOINT> -u admin -p
SHOW TABLES;                  # List tables
SELECT * FROM users;          # Query data

# EC2 (SSH)
ssh -i key.pem ubuntu@IP
sudo /etc/init.d/nginx start
pm2 start npm -- start
pm2 logs

# Test Endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/plants
```

---

## 📊 Key Files to Know

| File | What It Does |
|------|---|
| CLOUD_COMPUTING_IMPLEMENTATION_GUIDE.md | 📖 Complete guide (read first!) |
| QUICK_START_GUIDE.md | ⚡ Fast reference |
| ASSIGNMENT_CHECKLIST.md | ✅ Grading breakdown |
| Backend/src/services/RDSService.ts | 🗄️ Database operations |
| Backend/src/services/S3Service.ts | 📦 S3 operations |
| Backend/scripts/init-db.sql | 🔧 Database schema |
| docker-compose.yml | 🐳 Docker setup |

---

## ✅ Before Submission

```
EC2 Deployed?           [ ] Screenshot proof
S3 Bucket Created?      [ ] Files uploaded
RDS Connected?          [ ] Tables created
API Working?            [ ] Test endpoints
Docker Working?         [ ] docker-compose up
Documentation Done?     [ ] All guides written
Extra Features?         [ ] Load balancer, monitoring, etc.
```

---

## 🚨 Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| Can't SSH to EC2 | Check security group allows port 22 |
| RDS won't connect | Verify credentials, check security group |
| S3 upload fails | Check IAM permissions, bucket name |
| Docker error | Restart Docker: `sudo service docker restart` |
| Port already in use | `lsof -i :3000` and kill process |

---

## 💰 AWS Free Tier Reminder

✅ **FREE for 12 months:**
- EC2: 750 hours/month
- RDS: 750 hours/month
- S3: 5 GB/month

⚠️ **Set billing alerts at $5!**

---

## 🔑 Important Links

- [AWS Console Login](https://console.aws.amazon.com)
- [EC2 Dashboard](https://console.aws.amazon.com/ec2)
- [S3 Console](https://console.aws.amazon.com/s3)
- [RDS Dashboard](https://console.aws.amazon.com/rds)
- [AWS Billing](https://console.aws.amazon.com/billing)

---

## 📝 Environment Variables

```bash
# Create Backend/.env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=plant-management-uploads

RDS_HOST=endpoint.rds.amazonaws.com
RDS_USER=admin
RDS_PASSWORD=password
RDS_DATABASE=plant_management

NODE_ENV=development
PORT=3000
```

---

## 🎯 10-Day Timeline

| Day | Task |
|-----|------|
| 1-2 | Study AWS, create account |
| 3   | Setup local dev environment |
| 4   | EC2 instance + S3 bucket |
| 5   | RDS database setup |
| 6   | Connect backend to all services |
| 7   | Docker & docker-compose |
| 8   | Load balancing / monitoring |
| 9   | Testing & documentation |
| 10  | Final submission |

---

## 🌟 Bonus Features (for higher marks)

- [ ] Load Balancer (ALB)
- [ ] Auto-Scaling Group
- [ ] CloudWatch Monitoring
- [ ] CI/CD Pipeline (GitHub Actions)
- [ ] Infrastructure as Code (Terraform)
- [ ] Multiple EC2 Instances
- [ ] Database Backups

Each adds ~5-10% to grade!

---

## 📞 Emergency Checklist

If stuck:
1. ✅ Read CLOUD_COMPUTING_IMPLEMENTATION_GUIDE.md
2. ✅ Check AWS Console for resource status
3. ✅ Review CloudWatch logs
4. ✅ Check security group rules
5. ✅ Verify credentials in .env
6. ✅ Test each service independently
7. ✅ Check AWS status page for outages

---

## 🎓 Success Indicators

You're on track if:
- ✅ Backend runs on EC2
- ✅ S3 files upload/download
- ✅ RDS queries work
- ✅ API responses are fast
- ✅ Docker containers start
- ✅ Documentation is complete

---

## 🏁 Submission Format

```
CC-FA/
├── SUBMISSION.md (Assignment report)
├── screenshots/ (Evidence)
│   ├── ec2-running.png
│   ├── s3-bucket.png
│   ├── rds-database.png
│   └── backend-deployed.png
├── README_CLOUD_ASSIGNMENT.md
├── CLOUD_COMPUTING_IMPLEMENTATION_GUIDE.md
├── QUICK_START_GUIDE.md
├── ASSIGNMENT_CHECKLIST.md
└── Full Backend & Frontend
```

---

**Print this card and keep it handy! 📋**

*Reference all guides in CLOUD_COMPUTING_IMPLEMENTATION_GUIDE.md*

Good luck! 🚀
