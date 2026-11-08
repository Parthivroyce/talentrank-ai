# TalentRank AI — Production Deployment & Setup Guide

**Project Name:** TalentRank AI  
**Tagline:** Intelligent Hiring. Explainable Decisions.  
**Target Environment:** Node.js 22 LTS, Vite, Express, React 19, Google Cloud Run / Firebase

---

## 1. Prerequisites

Before installing, ensure your environment has:
- **Node.js:** `>= 20.x` (LTS recommended)
- **npm:** `>= 10.x`
- **Google Cloud SDK / AI Studio Account** (for Gemini API)
- **Firebase Project** (if binding to cloud Firestore and Firebase Auth)

---

## 2. Environment Variables Specification

Create a `.env` file in the project root based on `.env.example`.

> **CRITICAL SECURITY RULE:** Never commit `.env` or paste actual API secrets into Git repositories or frontend client bundles.

| Variable Name | Description | Environment |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key for server-side inference | Server-Side Only |
| `PORT` | HTTP server port (Defaults to `3000`) | Server-Side Only |
| `NODE_ENV` | Environment mode (`development` or `production`) | Server-Side Only |
| `FIREBASE_PROJECT_ID` | Optional Firebase project ID | Server-Side Only |
| `FIREBASE_CLIENT_EMAIL` | Optional Firebase Admin Service Account email | Server-Side Only |
| `FIREBASE_PRIVATE_KEY` | Optional Firebase Admin Service Account private key | Server-Side Only |

---

## 3. Step-by-Step Local Installation

1. **Clone Repository:**
   ```bash
   git clone https://github.com/talentrank-ai/talentrank-ai.git
   cd talentrank-ai
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Add your GEMINI_API_KEY into .env
   ```

4. **Run Unit & Integration Tests:**
   ```bash
   npm test
   ```

5. **Start Full-Stack Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

---

## 4. Demo Account Provisioning & Roles

The system comes pre-configured with two demonstration personas matching the client brief:

### Persona 1: Recruiter
- **Email:** `recruiter@talentrank.ai`
- **Role:** `recruiter`
- **Access Level:** Full operational access to dashboard metrics, JD intake, bulk CV upload, candidate ranking, recruiter reviews, pipeline Kanban, and DPDP privacy audits.

### Persona 2: Client Hiring Manager
- **Email:** `hiring.manager@apexfintech.com`
- **Organization:** `Apex Global Financial Services`
- **Role:** `client`
- **Access Level:** Isolated portal access showing only candidates explicitly submitted to Apex Global Financial Services with masked candidate emails and phone numbers.

---

## 5. Seed Data & Benchmark Test Cases

The application automatically seeds a comprehensive test database with 15+ candidate profiles, including the exact required benchmark candidates:

1. **Ritika Bansal (`CND-91022`):** Senior Java Developer (6.5y exp, Java, Spring Boot, 60 days notice). Scores **92%** (Strong Recommendation).
2. **Pooja Nair (`CND-91088`):** Java Developer (4y exp < 5y min, 90 days notice > 60d max). Scores **56%** (Potential Gaps).
3. **Arjun Rawat (`CND-91047`):** KYC Analyst (3y banking compliance). Scores **24%** (Low Fit).

---

## 6. Production Deployment (Google Cloud Run)

To deploy TalentRank AI on Google Cloud Run:

1. **Build Frontend Bundle:**
   ```bash
   npm run build
   ```

2. **Build and Deploy Container to Cloud Run:**
   ```bash
   gcloud run deploy talentrank-ai \
     --source . \
     --platform managed \
     --region asia-east1 \
     --allow-unauthenticated \
     --set-env-vars NODE_ENV=production,PORT=3000
   ```

---

## 7. Verification Checklist

- [x] Recruiter and Client logins function with backend role enforcement.
- [x] Gemini AI extracts JD into editable scorecard.
- [x] Bulk CV uploads parse PDF and DOCX files.
- [x] Duplicate candidates detected via normalized fingerprints.
- [x] Verifiable quotations validated against candidate CV text.
- [x] PII masked for client hiring manager portal.
- [x] DPDP Act 2023 consent records and right to erasure workflows execute cleanly.
- [x] 14/14 automated tests pass.
