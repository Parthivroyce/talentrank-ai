# TalentRank AI
> **Intelligent Hiring. Explainable Decisions.**

TalentRank AI is an enterprise recruitment and AI resume screening SaaS platform built for staffing organizations managing high-volume contract and permanent IT, banking back-office, and retail recruitment.

Developed for a staffing firm in Noida managing **70 recruiters, 120 employees, ~300 open requisitions/month, and ~120 CVs per requisition**.

---

## Key Features

1. **Role-Based Portals (Recruiter vs Client Hiring Manager):**
   - Recruiter operations: Dashboard metrics, AI JD intake, bulk uploads, ranked candidate evaluations, recruiter review gates, and pipeline Kanban boards.
   - Client portal: Isolated access to candidate profiles submitted to their organization with masked emails and phone numbers.

2. **AI Job Description Scorecards:**
   - Powered by Gemini (`gemini-3.8-flash`) via server-side `@google/genai` SDK.
   - Extracts 12 key dimensions: Title, location, employment type, experience ranges, CTC, notice period, educational requirements, must-have skills, and nice-to-have skills.
   - Fully customizable and editable scoring weights.

3. **High-Throughput Bulk CV Upload & Parsing:**
   - Supports `.pdf` and `.docx` multi-file uploads.
   - Normalized duplicate fingerprinting preventing redundant candidate entries.
   - Asynchronous queuing with detailed success/duplicate/failure tracking.

4. **Transparent, Verifiable Candidate Scoring:**
   - Every score dimension is supported by **verbatim quotations** from the candidate CV text.
   - Strict server-side verification ensures quotations exist in raw candidate text.
   - If missing or unverified, marked as "Not found in CV" with score 0.

5. **Fairness & Anti-Bias Protections:**
   - Names, emails, phones, photos, age, gender, and marital status are stripped prior to scoring.
   - Low-scoring candidates remain 100% searchable in tables.
   - Delivery-head fairness review monitors human-AI divergence (e.g., 8.3% override rate).

6. **Privacy & DPDP Act 2023 Compliance:**
   - Consent records registry with purpose limitation.
   - Client PII masking.
   - Right to Erasure deletion workflow permanently purging raw CV text and personal data while retaining minimal audit logs.
   - Immutable audit logging of all system actions.

---

## Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide icons
- **Backend:** Node.js 22 LTS, Express, TypeScript, Vite middlewares
- **AI/ML:** Google Gemini API (`gemini-3.8-flash`) with structured JSON schema
- **Document Processing:** Mammoth (DOCX), pdf-parse (PDF)
- **Database:** In-Memory Firestore-compatible store with full Cloud Firestore readiness
- **Testing:** Integration & unit test suite (`src/test/runAllTests.ts`)

---

## Quick Start & Demo Accounts

### 1. Installation
```bash
git clone https://github.com/talentrank-ai/talentrank-ai.git
cd talentrank-ai
npm install
npm test
npm run dev
```

### 2. Evaluator Demo Logins
- **Recruiter:** `recruiter@talentrank.ai` (Full recruitment operations & AI intake)
- **Client Hiring Manager:** `hiring.manager@apexfintech.com` (Apex Global Financial Services portal)

---

## Submission Package Contents

1. `TalentRank_AI_Technical_Design_Document.pdf` — Comprehensive 20-section architectural document.
2. `deployment.md` — Detailed production deployment, environment variables, and verification manual.
3. `TalentRank_AI_Submission.zip` — Pristine archive containing exactly the 2 required submission deliverables.
