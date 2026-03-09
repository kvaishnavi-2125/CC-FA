# GreenGuardian - Cloud Computing Mini Project

A full-stack cloud-enabled web application for plant care tracking, intelligent recommendations, and user communication.

This project is prepared for academic assessment under Cloud Computing theory and laboratory components.

## 1. Course Information

- Course Name: Cloud Computing
- Course Code: BCE26PE07
- Program: B.Tech. Computer Engineering (Semester VI)
- Related Lab Course: Cloud Computing Laboratory (BCE26PE08)
- Assessment Context: Mini project integrating compute, storage, database, networking, security, scalability concepts

## 2. Project Overview

GreenGuardian helps users manage home plants by providing:
- Plant profile management
- Personalized care recommendations using AI
- Plant care chat assistant
- Email-based notifications and verification
- Cloud-backed authentication, storage, and database services

## 3. What Was Implemented (Short Summary)

- Built a complete full-stack application with React + TypeScript frontend and Node.js + Express backend.
- Used cloud database and auth services (Supabase) for users and plant data.
- Added cloud object storage support for plant images.
- Integrated AI-based recommendation and chat workflow using Groq LLM API.
- Implemented email verification and recommendation emails using Resend.
- Configured CORS, backend health checks, and deployment-friendly environment configuration.
- Structured the project with modular services for users, plants, AI, email, and storage.

## 4. Cloud Computing Concepts Mapped to Syllabus

### Unit I: Cloud Fundamentals and Virtualization
- Client-server cloud application model with separate frontend and backend layers.
- Service-oriented backend design with modular APIs.
- Deployment on cloud-hosted environments (supports virtualized compute deployment).

### Unit II: Web Services (AWS / PaaS / SaaS view)
- RESTful web services for user, plant, and chat operations.
- Cloud API integration pattern with third-party managed services.
- Uses cloud-hosted frontend + backend architecture suitable for EC2/S3 deployment.

### Unit III: Database Services in Cloud
- Cloud database integration through Supabase tables for users and plants.
- Managed authentication via Supabase Auth.
- Cloud object storage for image assets and retrieval.

### Unit IV: Security, Availability, Scalability
- CORS origin allow-list and environment-driven origin configuration.
- Email verification token flow with signed token and expiry check.
- Health endpoints (`/` and `/healthz`) for monitoring and reliability checks.
- Graceful fallback behavior when backend or AI service is temporarily unavailable.

## 5. Laboratory Assignment Coverage

| Lab Assignment | Status | Implementation in This Project |
|---|---|---|
| 1. First VM on AWS/Azure/GCP | Covered (Deployment ready) | Backend designed for cloud VM hosting with env-based host/port and production build |
| 2. Storage Configuration | Covered | Cloud object storage for plant images and static frontend hosting compatibility |
| 3. Database Configuration | Covered | Supabase cloud database integration for users/plants with service-based data access |
| 4. Networking and Security | Covered | CORS policy, auth flow, tokenized email verification, controlled API endpoints |
| 5. High Availability and Scalability | Partially covered | Health checks, resilient fallbacks, stateless service design, cloud deployment model |
| 6. Mini Project | Fully covered | Complete integrated application combining compute, storage, DB, networking, security |

## 6. System Architecture

```text
Frontend (React + Vite + TypeScript)
        |
        | HTTPS/REST
        v
Backend (Node.js + Express + TypeScript)
        |
        |------------------> Supabase (Auth + DB + Storage)
        |------------------> Groq API (AI recommendations/chat)
        |------------------> Resend (Email delivery)
        |------------------> AWS S3 helpers (storage integration layer)
```

## 7. Major Features

- User signup/login with verification workflow
- User profile and preferences management
- Add and manage plant records
- AI-generated plant care recommendations
- Plant-focused chat assistant
- Email notifications and recommendation delivery
- Category browsing, favorites, notifications, and settings pages

## 8. Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- React Query
- Tailwind CSS + shadcn/ui components

### Backend
- Node.js
- Express
- TypeScript
- Supabase JS SDK
- Groq SDK
- Resend SDK
- AWS SDK (S3 client utilities)

## 9. Project Structure

```text
CC-FA/
  Backend/
    src/
      index.ts
      services/
        users.ts
        plants.ts
        GeminiService.ts
        EmailService.ts
        S3Service.ts
        supabase.ts
  Frontend/
    src/
      pages/
      components/
      services/
      contexts/
```

## 10. Setup and Run

### Prerequisites
- Node.js 18+
- npm
- Supabase project (URL + keys)
- Groq API key
- Resend API key

### Backend Environment Variables (`Backend/.env`)
- `PORT`
- `HOST`
- `PUBLIC_BACKEND_URL`
- `FRONTEND_URL`
- `CORS_ORIGINS`
- `VERIFICATION_TOKEN_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (recommended)
- `SUPABASE_ANON_KEY` (fallback)
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `RESEND_API_KEY`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`

### Frontend Environment Variables (`Frontend/.env`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_BACKEND_BASE_URL`
- `VITE_LOCAL_BACKEND_BASE_URL`
- `VITE_USE_REMOTE_BACKEND_IN_LOCAL`
- `VITE_FRONTEND_URL`

### Run Backend
```bash
cd Backend
npm install
npm run dev
```

### Run Frontend
```bash
cd Frontend
npm install
npm run dev
```

## 11. API Endpoints (Core)

- `GET /` - backend status check
- `GET /healthz` - lightweight health check
- `GET /user?uid=<id>` - fetch user
- `POST /user` - create/sync user
- `POST /verify-email` - verify account email token
- `GET /plants?uid=<id>` - fetch user plants
- `GET /plants/:id` - fetch plant by id
- `POST /plants` - create plant and trigger recommendation/email flow
- `POST /chat` - AI chat endpoint for plant assistance

## 12. Deployment Notes (Important)

- Frontend routing uses browser history; static hosting should redirect unknown paths to `index.html`.
- Backend CORS supports defaults and additional origins through `CORS_ORIGINS`.
- Rebuild backend (`npm run build`) before production deployment to avoid stale output.
- `SUPABASE_SERVICE_ROLE_KEY` is recommended for consistent backend read/write under RLS.

## 13. Course Outcome Mapping

| Course Outcome | Evidence in Project |
|---|---|
| CO1: Understand cloud services/models/virtualization | Multi-service cloud architecture and managed cloud APIs |
| CO2: Analyze storage services | Image/object storage integration and retrieval workflows |
| CO3: Apply cloud database services | Supabase cloud database + auth integration for deployment |
| CO4: Apply networking and security options | CORS, token verification, auth checks, resilient API design |

## 14. Viva / Demonstration Checklist

- User registration and email verification flow
- Login and protected route behavior
- Add plant with image and metadata
- AI recommendation generation for newly added plant
- Chat assistant response for plant queries
- Health endpoint and backend connectivity verification
- Database records validation in cloud console

## 15. Future Scope

- Containerized deployment using Docker/Kubernetes
- Auto-scaling and load-balancer based production architecture
- Observability stack (logs, metrics, tracing)
- Scheduled reminders and push notifications
- Multi-cloud deployment comparison (AWS/Azure/GCP)
