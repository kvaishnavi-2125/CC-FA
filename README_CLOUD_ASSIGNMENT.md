# 🌱 Plant Management Cloud Computing Assignment

A comprehensive **full-stack cloud application** demonstrating AWS services: **EC2, S3, and RDS**.

## 📚 Assignment Components

This project covers the Cloud Computing syllabus requirements through practical implementation:

| Topic | Implementation | Status |
|-------|---|---|
| **Virtual Machines** | EC2 Instance Deployment | ✅ Guide Provided |
| **Storage Services** | S3 CRUD Operations | ✅ Implemented |
| **Database Services** | RDS MySQL Setup | ✅ Complete Schema |
| **Virtualization** | Docker & docker-compose | ✅ Containers Ready |
| **Load Balancing** | AWS ALB Configuration | ✅ Guide Provided |
| **Monitoring** | CloudWatch Integration | ✅ Blueprint Included |

---

## 🚀 Quick Start (5 min)

1. **Read the main guide**: [CLOUD_COMPUTING_IMPLEMENTATION_GUIDE.md](CLOUD_COMPUTING_IMPLEMENTATION_GUIDE.md)
2. **Follow step-by-step**: [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)
3. **Check grading**: [ASSIGNMENT_CHECKLIST.md](ASSIGNMENT_CHECKLIST.md)

---

## 📁 What's Included

### 📖 Documentation (Must Read)
```
├── CLOUD_COMPUTING_IMPLEMENTATION_GUIDE.md  ← Complete implementation guide
├── QUICK_START_GUIDE.md                     ← Fast reference & commands
├── ASSIGNMENT_CHECKLIST.md                  ← Grading breakdown & timeline
└── DEPLOYMENT.md                            ← Architecture & deployment
```

### 🔧 Backend Code
```
Backend/
├── src/services/
│   ├── S3Service.ts              (Upload, download, delete from S3)
│   ├── RDSService.ts             (NEW - MySQL database operations)
│   ├── EmailService.ts           (Email notifications)
│   └── GeminiService.ts          (AI plant recommendations)
├── scripts/
│   └── init-db.sql               (NEW - Database schema)
├── Dockerfile                    (NEW - Container config)
├── .env.template                 (NEW - Environment variables)
└── package.json                  (Updated with mysql2)
```

### 🎨 Frontend
```
Frontend/
├── Dockerfile                    (NEW - Container config)
└── src/pages/
    ├── MyPlantsPage.tsx          (Display user's plants)
    ├── AddPlantPage.tsx          (Upload plant images to S3)
    └── ...
```

### 🐳 Containerization
```
├── docker-compose.yml            (NEW - Local dev environment)
├── nginx.conf                    (NEW - Reverse proxy setup)
└── Backend/Dockerfile            (NEW - Backend container)
└── Frontend/Dockerfile           (NEW - Frontend container)
```

---

## 🎯 Key Features Implemented

### ✅ S3 Bucket Operations
```typescript
// Upload images
const response = await uploadToS3(fileBuffer, 'photo.jpg', 'plants');

// Generate temporary download links
const signedUrl = await getSignedS3Url('plants/12345-photo.jpg');

// Delete files
await deleteFromS3('plants/12345-photo.jpg');
```

### ✅ RDS MySQL Database
```typescript
// User management
await createUser(email, passwordHash, fullName);
await getUserById(userId);
await updateUserProfile(userId, newName);

// Plant tracking
await createPlant(plantData);
await getUserPlants(userId);
await updatePlant(plantId, newData);
await deletePlant(plantId);

// Care logs
await addCareLog(plantId, 'watering', 'notes');
await getCareLogs(plantId);

// Favorites & notifications
await addFavorite(userId, plantId);
await createNotification(userId, 'watering_reminder', message);
```

### ✅ Docker Support
```bash
# Start entire stack locally
docker-compose up -d

# Services include:
# - MySQL database
# - Backend API
# - Frontend UI
# - Nginx reverse proxy
# - Redis cache
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Web Clients                           │
│              (Browser / Mobile App)                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│          AWS Application Load Balancer                  │
│         (Distributes traffic across servers)           │
└─────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────┼──────────────────┐
        ↓                 ↓                   ↓
    ┌────────┐       ┌────────┐         ┌────────┐
    │ EC2    │       │ EC2    │         │ EC2    │
    │Server 1│       │Server 2│         │Server 3│
    └────────┘       └────────┘         └────────┘
        │                 │                   │
        └─────────────────┼──────────────────┘
                          ↓
        ┌─────────────────────────────────────┐
        │  AWS RDS MySQL (Multi-AZ)           │
        │  plant_management database          │
        │  7 Tables: users, plants, etc.      │
        └─────────────────────────────────────┘
        
        ┌─────────────────────────────────────┐
        │  AWS S3 Bucket                      │
        │  plant-management-uploads           │
        │  Stores plant images                │
        └─────────────────────────────────────┘
```

---

## 📋 Database Schema

The RDS instance includes 7 comprehensive tables:

1. **users** - User accounts & profiles
2. **plants** - Plant data & properties
3. **care_logs** - Maintenance history
4. **favorites** - Bookmarked plants
5. **notifications** - User alerts
6. **plant_categories** - Plant classification
7. **growth_records** - Growth tracking

All with proper relationships, indexes, and constraints.

---

## 🔧 Setup Instructions

### Prerequisites
- AWS Free Tier Account
- Docker & Docker Compose
- Git
- Node.js 20+

### Step 1: Clone Repository
```bash
git clone https://github.com/kvaishnavi-2125/CC-FA.git
cd CC-FA
```

### Step 2: Local Development (Docker)
```bash
# Create .env from template
cp Backend/.env.template Backend/.env
# Edit Backend/.env with your AWS credentials

# Start all services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f backend
```

### Step 3: AWS Deployment (EC2)
```bash
# Follow steps in QUICK_START_GUIDE.md
# 1. Create EC2 instance
# 2. Deploy backend
# 3. Create S3 bucket
# 4. Setup RDS database
```

---

## 📈 Testing All Services

### Test S3 CRUD Operations
```bash
# Upload file
curl -X POST http://localhost:3000/api/upload \
  -F "file=@photo.jpg" \
  -F "folder=plants"

# Delete file
curl -X DELETE http://localhost:3000/api/delete \
  -d '{"key":"plants/12345-photo.jpg"}'
```

### Test RDS Operations
```bash
# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "pass123",
    "fullName": "User Name"
  }'

# Create plant
curl -X POST http://localhost:3000/api/plants \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "name": "Rose",
    "species": "Rosa"
  }'

# Get user plants
curl http://localhost:3000/api/plants?userId=1

# Add care log
curl -X POST http://localhost:3000/api/plants/1/care \
  -H "Content-Type: application/json" \
  -d '{
    "careType": "watering",
    "notes": "Watered thoroughly"
  }'
```

---

## 🌟 Extra Features for Advanced Grades

Implement any of these for bonus marks:

### Infrastructure & Scaling
- [ ] **Application Load Balancer** - Balance traffic across 2-3 EC2 instances
- [ ] **Auto-Scaling Group** - Automatically scale instances based on demand
- [ ] **Custom VPC** - Secure network architecture with public/private subnets

### Monitoring & Operations
- [ ] **CloudWatch Dashboards** - Real-time metrics visualization
- [ ] **CloudWatch Alarms** - Alerts for high CPU, memory, errors
- [ ] **RDS Backup Strategy** - Automated backups and recovery testing

### Optimization
- [ ] **ElastiCache Redis** - Cache frequently accessed data
- [ ] **CloudFront CDN** - Global content delivery for images
- [ ] **Database Query Optimization** - Proper indexing and explain plans

### DevOps
- [ ] **Docker Hub Integration** - Push images to registry
- [ ] **CI/CD Pipeline** - GitHub Actions for automated deployment
- [ ] **Infrastructure as Code** - Terraform for reproducible setup
- [ ] **API Documentation** - Swagger/OpenAPI specs

---

## 📊 Cost Estimate (AWS Free Tier - 12 months)

| Service | Free Allocation | Beyond Free |
|---------|---|---|
| EC2 | 750 hrs/month | $0.0104/hr |
| RDS | 750 hrs/month | $0.024/hr |
| S3 | 5 GB/month | $0.023/GB |
| Data Transfer | 100 GB/month | $0.09/GB |
| **TOTAL** | ✅ **FREE** | ~$50-100/mo |

⚠️ **Always use AWS Billing Alerts!**

---

## 📋 Submission Checklist

Before submitting, ensure:

- [ ] All code pushed to GitHub
- [ ] README.md updated with project info
- [ ] .env.template provided (no secrets!)
- [ ] docker-compose.yml working
- [ ] Backend deployed on EC2
- [ ] S3 bucket created & tested
- [ ] RDS database configured & connected
- [ ] API endpoints documented
- [ ] Screenshots taken (EC2, S3, RDS, API)
- [ ] Architecture diagram created
- [ ] Deployment guide written
- [ ] Performance metrics documented
- [ ] Extra features implemented (bonus)

---

## 📚 Learning Resources

### AWS Documentation
- [EC2 Getting Started](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html)
- [S3 Developer Guide](https://docs.aws.amazon.com/s3/latest/dev/Welcome.html)
- [RDS MySQL Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_MySQL.html)

### Project Guides
- **Main Implementation**: [CLOUD_COMPUTING_IMPLEMENTATION_GUIDE.md](CLOUD_COMPUTING_IMPLEMENTATION_GUIDE.md)
- **Quick Reference**: [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)
- **Grading Guide**: [ASSIGNMENT_CHECKLIST.md](ASSIGNMENT_CHECKLIST.md)

### AWS Free Tier
- [AWS Free Tier](https://aws.amazon.com/free)
- [AWS Training](https://aws.amazon.com/training/)

---

## 🎯 Expected Learning Outcomes

After completing this project, you will be able to:

✅ Deploy applications on AWS EC2 instances  
✅ Configure and manage S3 buckets for storage  
✅ Set up RDS databases with proper schema  
✅ Implement CRUD operations across cloud services  
✅ Use Docker for containerization  
✅ Configure load balancing and monitoring  
✅ Write deployment automation scripts  
✅ Create scalable cloud architectures  

---

## 🤝 Support

### If You Get Stuck:

1. **Check the documentation**: [CLOUD_COMPUTING_IMPLEMENTATION_GUIDE.md](CLOUD_COMPUTING_IMPLEMENTATION_GUIDE.md)
2. **Follow the quick start**: [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)
3. **Review error logs**: `docker-compose logs`
4. **Test connectivity**: `telnet <host> <port>`
5. **Check AWS Console**: Verify resource status

### Common Issues:
- **EC2 connection failed**: Check security group rules
- **RDS connection failed**: Verify credentials and VPC settings
- **S3 upload failed**: Check IAM permissions and bucket name
- **Docker won't start**: Ensure Docker daemon is running

---

## 📝 Files Reference

| File | Purpose | Status |
|------|---------|--------|
| CLOUD_COMPUTING_IMPLEMENTATION_GUIDE.md | Complete step-by-step guide | ✅ |
| QUICK_START_GUIDE.md | Fast reference with commands | ✅ |
| ASSIGNMENT_CHECKLIST.md | Grading breakdown & timeline | ✅ |
| Backend/src/services/RDSService.ts | MySQL database operations | ✅ |
| Backend/src/services/S3Service.ts | S3 CRUD operations | ✅ |
| Backend/scripts/init-db.sql | Database schema creation | ✅ |
| docker-compose.yml | Local development environment | ✅ |
| nginx.conf | Reverse proxy configuration | ✅ |
| Backend/.env.template | Environment variables template | ✅ |

---

## 🎓 Grading Expectations

**Basic (70%):** EC2 + S3 + RDS working  
**Good (80%):** + Docker containerization  
**Excellent (90%+):** + Load balancing, monitoring, CI/CD  

---

## 📞 Questions?

Refer to the implementation guide and quick-start guide. Both contain comprehensive troubleshooting sections.

---

**Ready to get started? 👉 [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)**

---

*Last Updated: March 2026*  
*Cloud Computing Curriculum - Assignment Implementation*
