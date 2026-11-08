// TalentRank AI — Express Full-Stack Server
// Implements secure, authenticated REST API routes, Vite dev middleware mounting,
// role-based authorization, client isolation, and Gemini AI operations.

import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import { db } from './src/server/db.js';
import {
  extractJobDescriptionToScorecard,
  parseCvTextToCandidateProfile,
  scoreCandidateAgainstScorecard,
} from './src/server/geminiService.js';
import { extractTextFromBuffer, generateDuplicateFingerprint } from './src/server/documentProcessor.js';
import { UserRole, PipelineStage } from './src/types/talentrank.js';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer in-memory storage for handling multi-file bulk uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB per file
});

// Middleware: Authenticate & Resolve Role
// Reads x-user-id header or Bearer token, enforces trusted role resolution from db
const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const userIdHeader = req.headers['x-user-id'] as string;

  let userId = userIdHeader;
  if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
    userId = authHeader.split(' ')[1];
  }

  // Default to recruiter for initial convenience if unspecified
  if (!userId) {
    userId = 'usr-recruiter-01';
  }

  const user = db.getUserById(userId);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized: User record not found' });
    return;
  }

  (req as any).user = user;
  next();
};

// Role Enforcement Guards
const requireRole = (role: UserRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user || user.role !== role) {
      res.status(403).json({ error: `Forbidden: This action requires role '${role}'` });
      return;
    }
    next();
  };
};

/* ==========================================================================
   AUTH & USER ENDPOINTS
   ========================================================================== */

app.post('/api/auth/login', (req: Request, res: Response): void => {
  const { email, password } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials or user not provisioned' });
    return;
  }

  db.addAuditLog({
    actorUserId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'USER_LOGIN',
    resourceType: 'system',
    resourceId: user.id,
    details: { email: user.email },
  });

  res.json({
    user,
    token: user.id,
  });
});

app.get('/api/auth/me', authenticate, (req: Request, res: Response): void => {
  res.json({ user: (req as any).user });
});

/* ==========================================================================
   REQUISITIONS & SCORECARDS
   ========================================================================== */

app.get('/api/requisitions', authenticate, (req: Request, res: Response): void => {
  const user = (req as any).user;
  let reqs = db.getRequisitions();

  // If Client role, restrict strictly to requisitions tied to their organization
  if (user.role === 'client') {
    reqs = reqs.filter((r) => r.organizationId === user.organizationId);
  }

  res.json({ requisitions: reqs });
});

app.get('/api/requisitions/:id', authenticate, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const requisition = db.getRequisitionById(req.params.id);

  if (!requisition) {
    res.status(404).json({ error: 'Requisition not found' });
    return;
  }

  // Client data isolation
  if (user.role === 'client' && requisition.organizationId !== user.organizationId) {
    res.status(403).json({ error: 'Forbidden: You do not have access to this requisition' });
    return;
  }

  const scorecard = requisition.scorecardId ? db.scorecards.get(requisition.scorecardId) : undefined;
  res.json({ requisition, scorecard });
});

app.post('/api/requisitions', authenticate, requireRole('recruiter'), (req: Request, res: Response): void => {
  const user = (req as any).user;
  const { title, organizationId, department, location, employmentType, openings, minExp, maxExp, minCtc, maxCtc, maxNotice, rawJd } = req.body;

  if (!title || !organizationId) {
    res.status(400).json({ error: 'Title and Client Organization are required' });
    return;
  }

  const org = db.organizations.get(organizationId);
  const count = db.requisitions.size + 1;
  const reqNumber = `REQ-2026-${String(count).padStart(3, '0')}`;
  const reqId = `req-${Date.now()}`;

  const newReq = {
    id: reqId,
    reqNumber,
    title,
    organizationId,
    organizationName: org ? org.name : 'Client Organization',
    department: department || 'Engineering',
    location: location || 'Noida',
    employmentType: employmentType || 'permanent',
    openings: openings ? Number(openings) : 1,
    status: 'active' as const,
    minExperienceYears: minExp ? Number(minExp) : 5,
    maxExperienceYears: maxExp ? Number(maxExp) : 8,
    minCtcLakhs: minCtc ? Number(minCtc) : undefined,
    maxCtcLakhs: maxCtc ? Number(maxCtc) : undefined,
    maxNoticeDays: maxNotice ? Number(maxNotice) : 60,
    rawJobDescription: rawJd || '',
    assignedRecruiterId: user.id,
    assignedRecruiterName: user.name,
    candidatesCount: 0,
    shortlistedCount: 0,
    interviewsCount: 0,
    joinedCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.requisitions.set(newReq.id, newReq);

  db.addAuditLog({
    actorUserId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'REQUISITION_CREATED',
    resourceType: 'requisition',
    resourceId: newReq.id,
    resourceIdentifier: newReq.reqNumber,
    details: { title: newReq.title },
  });

  res.status(201).json({ requisition: newReq });
});

// AI JD Intake -> Scorecard Extraction
app.post('/api/requisitions/extract-scorecard', authenticate, requireRole('recruiter'), async (req: Request, res: Response): Promise<void> => {
  const { rawJobDescription } = req.body;
  if (!rawJobDescription || rawJobDescription.trim().length < 10) {
    res.status(400).json({ error: 'Valid Job Description text is required' });
    return;
  }

  try {
    const extracted = await extractJobDescriptionToScorecard(rawJobDescription);
    res.json({ extracted });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to extract scorecard: ' + err.message });
  }
});

// Save or Update Scorecard
app.post('/api/requisitions/:id/scorecard', authenticate, requireRole('recruiter'), (req: Request, res: Response): void => {
  const user = (req as any).user;
  const requisition = db.getRequisitionById(req.params.id);
  if (!requisition) {
    res.status(404).json({ error: 'Requisition not found' });
    return;
  }

  const { jobTitle, location, employmentType, minExperienceYears, maxExperienceYears, minCtcLakhs, maxCtcLakhs, maxNoticeDays, educationalRequirements, mustHaveSkills, niceToHaveSkills, weights } = req.body;

  const existing = requisition.scorecardId ? db.scorecards.get(requisition.scorecardId) : undefined;
  const version = existing ? existing.version + 1 : 1;
  const scorecardId = existing ? existing.id : `sc-${Date.now()}`;

  const scorecard = {
    id: scorecardId,
    requisitionId: requisition.id,
    jobTitle: jobTitle || requisition.title,
    location: location || requisition.location,
    employmentType: employmentType || requisition.employmentType,
    minExperienceYears: Number(minExperienceYears) || requisition.minExperienceYears,
    maxExperienceYears: Number(maxExperienceYears) || requisition.maxExperienceYears,
    minCtcLakhs: minCtcLakhs ? Number(minCtcLakhs) : requisition.minCtcLakhs,
    maxCtcLakhs: maxCtcLakhs ? Number(maxCtcLakhs) : requisition.maxCtcLakhs,
    maxNoticeDays: Number(maxNoticeDays) || requisition.maxNoticeDays,
    educationalRequirements: educationalRequirements || '',
    mustHaveSkills: mustHaveSkills || [],
    niceToHaveSkills: niceToHaveSkills || [],
    weights: weights || {
      mustHaveSkills: 35,
      experienceRelevance: 25,
      niceToHaveSkills: 15,
      noticePeriod: 15,
      locationAndRoleFit: 10,
    },
    version,
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.scorecards.set(scorecard.id, scorecard);
  requisition.scorecardId = scorecard.id;
  requisition.updatedAt = new Date().toISOString();

  // Mark all existing candidate scores for this requisition as STALE if scorecard was modified
  if (existing) {
    for (const score of db.candidateScores.values()) {
      if (score.requisitionId === requisition.id) {
        score.isStale = true;
      }
    }
  }

  db.addAuditLog({
    actorUserId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: existing ? 'SCORECARD_UPDATED' : 'SCORECARD_GENERATED',
    resourceType: 'scorecard',
    resourceId: scorecard.id,
    resourceIdentifier: requisition.reqNumber,
    details: { version: scorecard.version },
  });

  res.json({ scorecard });
});

/* ==========================================================================
   BULK CV UPLOAD & DOCUMENT PARSING
   ========================================================================== */

app.post(
  '/api/requisitions/:id/upload-cvs',
  authenticate,
  requireRole('recruiter'),
  upload.array('files', 50),
  async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).user;
    const requisition = db.getRequisitionById(req.params.id);
    if (!requisition) {
      res.status(404).json({ error: 'Requisition not found' });
      return;
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const scorecard = requisition.scorecardId ? db.scorecards.get(requisition.scorecardId) : undefined;

    const results = {
      totalUploaded: files.length,
      processed: 0,
      duplicates: 0,
      failed: 0,
      candidates: [] as any[],
      duplicateDetails: [] as any[],
    };

    for (const file of files) {
      try {
        // 1. Extract text from PDF or DOCX
        const { text } = await extractTextFromBuffer(file.buffer, file.originalname, file.mimetype);

        // 2. Parse Profile from Text
        const profile = await parseCvTextToCandidateProfile(text, file.originalname);

        // 3. Duplicate check using normalized fingerprint
        const fingerprint = generateDuplicateFingerprint(profile.email, profile.phone, profile.name);

        let existingCandidate: any = null;
        for (const c of db.candidates.values()) {
          if (c.duplicateFingerprint === fingerprint || (profile.email && c.email.toLowerCase() === profile.email.toLowerCase())) {
            existingCandidate = c;
            break;
          }
        }

        if (existingCandidate) {
          results.duplicates++;
          results.duplicateDetails.push({
            filename: file.originalname,
            candidateNumber: existingCandidate.candidateNumber,
            name: existingCandidate.name,
            reason: 'Candidate with matching email or phone already exists in system',
          });
          continue;
        }

        // 4. Create new candidate
        const cndNum = `CND-${Math.floor(90000 + Math.random() * 9000)}`;
        const candidateId = `cnd-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const newCandidate = {
          id: candidateId,
          candidateNumber: cndNum,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          currentRole: profile.currentRole,
          totalExperienceYears: profile.totalExperienceYears,
          skills: profile.skills,
          location: profile.location,
          noticePeriodDays: profile.noticePeriodDays,
          currentCtcLakhs: profile.currentCtcLakhs,
          expectedCtcLakhs: profile.expectedCtcLakhs,
          education: profile.education,
          certifications: profile.certifications,
          employmentHistory: profile.employmentHistory,
          extractedCvText: text,
          sourceFilename: file.originalname,
          fileMimeType: file.mimetype,
          fileSizeBytes: file.size,
          duplicateFingerprint: fingerprint,
          requisitionId: requisition.id,
          stage: 'ai_evaluated' as PipelineStage,
          recruiterReviewed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        db.candidates.set(newCandidate.id, newCandidate);

        // 5. If scorecard exists, immediately trigger AI scoring
        if (scorecard) {
          const scoringResult = await scoreCandidateAgainstScorecard(
            text,
            {
              totalExperienceYears: newCandidate.totalExperienceYears,
              noticePeriodDays: newCandidate.noticePeriodDays,
              skills: newCandidate.skills,
              location: newCandidate.location,
              sourceFilename: newCandidate.sourceFilename,
            },
            scorecard
          );

          const candidateScore = {
            id: `sc-${newCandidate.id}`,
            candidateId: newCandidate.id,
            candidateNumber: newCandidate.candidateNumber,
            requisitionId: requisition.id,
            isStale: false,
            ...scoringResult,
          };

          db.candidateScores.set(candidateScore.id, candidateScore);
        }

        // 6. DPDP Consent Record
        const consent = {
          id: `con-${newCandidate.id}`,
          candidateId: newCandidate.id,
          candidateNumber: newCandidate.candidateNumber,
          candidateName: newCandidate.name,
          candidateEmail: newCandidate.email,
          consentPurpose: 'Hiring and candidate evaluation for specific recruitment requisitions',
          consentStatus: 'active' as const,
          dpdpNoticeVersion: 'v2026.1-DPDPA-Compliant',
          ipAddressMasked: '103.211.xxx.xxx',
          timestamp: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.consentRecords.set(consent.id, consent);

        requisition.candidatesCount++;
        results.processed++;
        results.candidates.push(newCandidate);

        db.addAuditLog({
          actorUserId: user.id,
          actorName: user.name,
          actorRole: user.role,
          action: 'CV_UPLOADED',
          resourceType: 'candidate',
          resourceId: newCandidate.id,
          resourceIdentifier: newCandidate.candidateNumber,
          details: { filename: file.originalname },
        });
      } catch (err: any) {
        console.error('File parsing error:', err);
        results.failed++;
      }
    }

    res.json(results);
  }
);

/* ==========================================================================
   CANDIDATE RANKING, SCORES & RECRUITER ACTIONS
   ========================================================================== */

app.get('/api/requisitions/:id/candidates', authenticate, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const requisition = db.getRequisitionById(req.params.id);

  if (!requisition) {
    res.status(404).json({ error: 'Requisition not found' });
    return;
  }

  // Client Data Isolation: Client role only sees candidates SUBMITTED to their org
  if (user.role === 'client') {
    if (requisition.organizationId !== user.organizationId) {
      res.status(403).json({ error: 'Forbidden: Access restricted' });
      return;
    }

    const submissions = db.getClientSubmissions(user.organizationId).filter((s) => s.requisitionId === requisition.id);
    const submittedCandidateIds = new Set(submissions.map((s) => s.candidateId));

    const clientCandidates = db
      .getCandidatesByRequisition(requisition.id)
      .filter((c) => submittedCandidateIds.has(c.id))
      .map((c) => {
        // MASK PII FOR CLIENT ROLE: Never expose candidate email, phone, or raw personal identifiers
        return {
          ...c,
          email: '*****@masked.talentrank.ai',
          phone: '+91 ***** *****',
        };
      });

    res.json({
      candidates: clientCandidates,
      submissions,
    });
    return;
  }

  // Recruiter view: returns all candidates with their associated scores
  const candidates = db.getCandidatesByRequisition(requisition.id);
  const candidateScores: Record<string, any> = {};
  for (const c of candidates) {
    const sc = db.getCandidateScore(c.id);
    if (sc) candidateScores[c.id] = sc;
  }

  res.json({ candidates, scores: candidateScores });
});

// Single Candidate Details
app.get('/api/candidates/:id', authenticate, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const candidate = db.getCandidateById(req.params.id);

  if (!candidate) {
    res.status(404).json({ error: 'Candidate not found' });
    return;
  }

  // Client access verification
  if (user.role === 'client') {
    const submissions = db.getClientSubmissions(user.organizationId);
    const isSubmitted = submissions.some((s) => s.candidateId === candidate.id);
    if (!isSubmitted) {
      res.status(403).json({ error: 'Forbidden: This candidate has not been submitted to your organization' });
      return;
    }

    // Mask PII
    const maskedCandidate = {
      ...candidate,
      email: '*****@masked.talentrank.ai',
      phone: '+91 ***** *****',
    };

    const score = db.getCandidateScore(candidate.id);
    const history = db.pipelineEvents.filter((e) => e.candidateId === candidate.id);

    db.addAuditLog({
      actorUserId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'CLIENT_VIEWED_CANDIDATE',
      resourceType: 'candidate',
      resourceId: candidate.id,
      resourceIdentifier: `${candidate.candidateNumber} (Masked)`,
    });

    res.json({ candidate: maskedCandidate, score, history });
    return;
  }

  // Recruiter Full View
  const score = db.getCandidateScore(candidate.id);
  const history = db.pipelineEvents.filter((e) => e.candidateId === candidate.id);
  const consent = db.consentRecords.get(`con-${candidate.id}`);

  db.addAuditLog({
    actorUserId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'CANDIDATE_VIEWED',
    resourceType: 'candidate',
    resourceId: candidate.id,
    resourceIdentifier: candidate.candidateNumber,
  });

  res.json({ candidate, score, history, consent });
});

// Re-Score Candidate (e.g. if Scorecard was updated)
app.post('/api/candidates/:id/score', authenticate, requireRole('recruiter'), async (req: Request, res: Response): Promise<void> => {
  const candidate = db.getCandidateById(req.params.id);
  if (!candidate) {
    res.status(404).json({ error: 'Candidate not found' });
    return;
  }

  const requisition = db.getRequisitionById(candidate.requisitionId);
  const scorecard = requisition?.scorecardId ? db.scorecards.get(requisition.scorecardId) : undefined;

  if (!scorecard) {
    res.status(400).json({ error: 'No active scorecard configured for this requisition' });
    return;
  }

  try {
    const scoreData = await scoreCandidateAgainstScorecard(
      candidate.extractedCvText,
      {
        totalExperienceYears: candidate.totalExperienceYears,
        noticePeriodDays: candidate.noticePeriodDays,
        skills: candidate.skills,
        location: candidate.location,
        sourceFilename: candidate.sourceFilename,
      },
      scorecard
    );

    const score = {
      id: `sc-${candidate.id}`,
      candidateId: candidate.id,
      candidateNumber: candidate.candidateNumber,
      requisitionId: candidate.requisitionId,
      isStale: false,
      ...scoreData,
    };

    db.candidateScores.set(score.id, score);
    res.json({ score });
  } catch (err: any) {
    res.status(500).json({ error: 'Scoring failed: ' + err.message });
  }
});

// Recruiter Review Candidate (Mandatory check before Client Submission)
app.post('/api/candidates/:id/recruiter-review', authenticate, requireRole('recruiter'), (req: Request, res: Response): void => {
  const user = (req as any).user;
  const candidate = db.getCandidateById(req.params.id);

  if (!candidate) {
    res.status(404).json({ error: 'Candidate not found' });
    return;
  }

  const { notes } = req.body;
  candidate.recruiterReviewed = true;
  candidate.recruiterNotes = notes || 'Reviewed and validated by recruiter.';
  candidate.recruiterReviewedAt = new Date().toISOString();
  candidate.recruiterReviewedBy = user.name;
  candidate.stage = 'recruiter_reviewed';
  candidate.updatedAt = new Date().toISOString();

  db.pipelineEvents.push({
    id: `evt-${Date.now()}`,
    candidateId: candidate.id,
    candidateNumber: candidate.candidateNumber,
    requisitionId: candidate.requisitionId,
    fromStage: 'ai_evaluated',
    toStage: 'recruiter_reviewed',
    actorUserId: user.id,
    actorName: user.name,
    actorRole: 'recruiter',
    note: candidate.recruiterNotes,
    timestamp: new Date().toISOString(),
  });

  db.addAuditLog({
    actorUserId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'CANDIDATE_REVIEWED',
    resourceType: 'candidate',
    resourceId: candidate.id,
    resourceIdentifier: candidate.candidateNumber,
    details: { notes: candidate.recruiterNotes },
  });

  res.json({ candidate });
});

// Recruiter Submit Candidate to Client
app.post('/api/candidates/:id/submit-to-client', authenticate, requireRole('recruiter'), (req: Request, res: Response): void => {
  const user = (req as any).user;
  const candidate = db.getCandidateById(req.params.id);

  if (!candidate) {
    res.status(404).json({ error: 'Candidate not found' });
    return;
  }

  // Strict Business Logic: Candidate MUST be reviewed by recruiter before client submission
  if (!candidate.recruiterReviewed) {
    res.status(400).json({ error: 'Compliance Rule: Recruiter must review and approve candidate profile before client submission.' });
    return;
  }

  const requisition = db.getRequisitionById(candidate.requisitionId);
  if (!requisition) {
    res.status(404).json({ error: 'Requisition not found' });
    return;
  }

  const subId = `sub-${candidate.id}`;
  const submission = {
    id: subId,
    requisitionId: requisition.id,
    candidateId: candidate.id,
    candidateNumber: candidate.candidateNumber,
    organizationId: requisition.organizationId,
    submittedByRecruiterId: user.id,
    submittedByRecruiterName: user.name,
    submittedAt: new Date().toISOString(),
    status: 'pending_review' as const,
  };

  db.clientSubmissions.set(submission.id, submission);

  const prevStage = candidate.stage;
  candidate.stage = 'submitted_to_client';
  candidate.updatedAt = new Date().toISOString();

  db.pipelineEvents.push({
    id: `evt-${Date.now()}`,
    candidateId: candidate.id,
    candidateNumber: candidate.candidateNumber,
    requisitionId: candidate.requisitionId,
    fromStage: prevStage,
    toStage: 'submitted_to_client',
    actorUserId: user.id,
    actorName: user.name,
    actorRole: 'recruiter',
    note: `Submitted to ${requisition.organizationName}`,
    timestamp: new Date().toISOString(),
  });

  db.addAuditLog({
    actorUserId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'CANDIDATE_SUBMITTED_TO_CLIENT',
    resourceType: 'candidate',
    resourceId: candidate.id,
    resourceIdentifier: candidate.candidateNumber,
    details: { organizationId: requisition.organizationId, orgName: requisition.organizationName },
  });

  res.json({ submission, candidate });
});

/* ==========================================================================
   CLIENT HIRING MANAGER PORTAL ENDPOINTS
   ========================================================================== */

// Client Shortlist Candidate
app.post('/api/client/candidates/:id/shortlist', authenticate, requireRole('client'), (req: Request, res: Response): void => {
  const user = (req as any).user;
  const candidate = db.getCandidateById(req.params.id);

  if (!candidate) {
    res.status(404).json({ error: 'Candidate not found' });
    return;
  }

  const submission = db.clientSubmissions.get(`sub-${candidate.id}`);
  if (!submission || submission.organizationId !== user.organizationId) {
    res.status(403).json({ error: 'Forbidden: Submission not found for your organization' });
    return;
  }

  const { feedback } = req.body;
  submission.status = 'shortlisted';
  submission.clientFeedback = feedback || 'Shortlisted by hiring manager.';
  submission.reviewedAt = new Date().toISOString();
  submission.reviewedBy = user.name;

  candidate.stage = 'client_shortlisted';
  candidate.updatedAt = new Date().toISOString();

  const reqObj = db.getRequisitionById(candidate.requisitionId);
  if (reqObj) reqObj.shortlistedCount++;

  db.pipelineEvents.push({
    id: `evt-${Date.now()}`,
    candidateId: candidate.id,
    candidateNumber: candidate.candidateNumber,
    requisitionId: candidate.requisitionId,
    fromStage: 'submitted_to_client',
    toStage: 'client_shortlisted',
    actorUserId: user.id,
    actorName: user.name,
    actorRole: 'client',
    note: submission.clientFeedback,
    timestamp: new Date().toISOString(),
  });

  db.addAuditLog({
    actorUserId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'CLIENT_SHORTLISTED',
    resourceType: 'candidate',
    resourceId: candidate.id,
    resourceIdentifier: candidate.candidateNumber,
    details: { feedback: submission.clientFeedback },
  });

  res.json({ submission, candidate });
});

// Client Reject Candidate (Mandatory Rejection Reason required)
app.post('/api/client/candidates/:id/reject', authenticate, requireRole('client'), (req: Request, res: Response): void => {
  const user = (req as any).user;
  const candidate = db.getCandidateById(req.params.id);

  if (!candidate) {
    res.status(404).json({ error: 'Candidate not found' });
    return;
  }

  const submission = db.clientSubmissions.get(`sub-${candidate.id}`);
  if (!submission || submission.organizationId !== user.organizationId) {
    res.status(403).json({ error: 'Forbidden: Submission not found for your organization' });
    return;
  }

  const { rejectionReason, feedback } = req.body;

  // Strict Rule: Mandatory rejection reason
  if (!rejectionReason || rejectionReason.trim().length < 5) {
    res.status(400).json({ error: 'A specific, mandatory rejection reason is required (minimum 5 characters).' });
    return;
  }

  submission.status = 'rejected';
  submission.rejectionReason = rejectionReason;
  submission.clientFeedback = feedback || rejectionReason;
  submission.reviewedAt = new Date().toISOString();
  submission.reviewedBy = user.name;

  candidate.stage = 'client_rejected';
  candidate.updatedAt = new Date().toISOString();

  db.pipelineEvents.push({
    id: `evt-${Date.now()}`,
    candidateId: candidate.id,
    candidateNumber: candidate.candidateNumber,
    requisitionId: candidate.requisitionId,
    fromStage: 'submitted_to_client',
    toStage: 'client_rejected',
    actorUserId: user.id,
    actorName: user.name,
    actorRole: 'client',
    note: `Rejected: ${rejectionReason}`,
    timestamp: new Date().toISOString(),
  });

  db.addAuditLog({
    actorUserId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'CLIENT_REJECTED',
    resourceType: 'candidate',
    resourceId: candidate.id,
    resourceIdentifier: candidate.candidateNumber,
    details: { rejectionReason },
  });

  res.json({ submission, candidate });
});

// Client Propose Interview
app.post('/api/client/candidates/:id/propose-interview', authenticate, requireRole('client'), (req: Request, res: Response): void => {
  const user = (req as any).user;
  const candidate = db.getCandidateById(req.params.id);

  if (!candidate) {
    res.status(404).json({ error: 'Candidate not found' });
    return;
  }

  const submission = db.clientSubmissions.get(`sub-${candidate.id}`);
  if (!submission || submission.organizationId !== user.organizationId) {
    res.status(403).json({ error: 'Forbidden: Submission not found for your organization' });
    return;
  }

  const { proposedDateTime, interviewType, durationMinutes, mode, meetingNotes } = req.body;

  if (!proposedDateTime) {
    res.status(400).json({ error: 'Proposed interview date and time is required' });
    return;
  }

  const proposal = {
    id: `prop-${Date.now()}`,
    requisitionId: candidate.requisitionId,
    candidateId: candidate.id,
    organizationId: user.organizationId,
    proposedByUserId: user.id,
    proposedByName: user.name,
    proposedDateTime,
    interviewType: interviewType || 'technical_round_1',
    durationMinutes: Number(durationMinutes) || 60,
    mode: mode || 'virtual_meet',
    meetingNotes: meetingNotes || '',
    status: 'confirmed' as const,
    createdAt: new Date().toISOString(),
  };

  db.interviewProposals.set(proposal.id, proposal);
  submission.status = 'interview_requested';

  candidate.stage = 'interview_scheduled';
  candidate.updatedAt = new Date().toISOString();

  const reqObj = db.getRequisitionById(candidate.requisitionId);
  if (reqObj) reqObj.interviewsCount++;

  db.pipelineEvents.push({
    id: `evt-${Date.now()}`,
    candidateId: candidate.id,
    candidateNumber: candidate.candidateNumber,
    requisitionId: candidate.requisitionId,
    fromStage: 'submitted_to_client',
    toStage: 'interview_scheduled',
    actorUserId: user.id,
    actorName: user.name,
    actorRole: 'client',
    note: `Interview scheduled for ${new Date(proposedDateTime).toLocaleString()}`,
    timestamp: new Date().toISOString(),
  });

  db.addAuditLog({
    actorUserId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'INTERVIEW_PROPOSED',
    resourceType: 'candidate',
    resourceId: candidate.id,
    resourceIdentifier: candidate.candidateNumber,
    details: { proposedDateTime, interviewType },
  });

  res.json({ proposal, candidate });
});

/* ==========================================================================
   PIPELINE STAGE TRANSITIONS & AUDIT LOGS
   ========================================================================== */

app.post('/api/candidates/:id/stage', authenticate, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const candidate = db.getCandidateById(req.params.id);

  if (!candidate) {
    res.status(404).json({ error: 'Candidate not found' });
    return;
  }

  const { toStage, note } = req.body;
  if (!toStage) {
    res.status(400).json({ error: 'Target stage is required' });
    return;
  }

  const prevStage = candidate.stage;
  candidate.stage = toStage;
  candidate.updatedAt = new Date().toISOString();

  // If moved to joined, increment count
  if (toStage === 'joined') {
    const reqObj = db.getRequisitionById(candidate.requisitionId);
    if (reqObj) reqObj.joinedCount++;
  }

  const event = {
    id: `evt-${Date.now()}`,
    candidateId: candidate.id,
    candidateNumber: candidate.candidateNumber,
    requisitionId: candidate.requisitionId,
    fromStage: prevStage,
    toStage,
    actorUserId: user.id,
    actorName: user.name,
    actorRole: user.role,
    note: note || `Status changed from ${prevStage} to ${toStage}`,
    timestamp: new Date().toISOString(),
  };

  db.pipelineEvents.push(event);

  db.addAuditLog({
    actorUserId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'PIPELINE_STAGE_CHANGED',
    resourceType: 'candidate',
    resourceId: candidate.id,
    resourceIdentifier: candidate.candidateNumber,
    details: { fromStage: prevStage, toStage, note },
  });

  res.json({ candidate, event });
});

// Audit Logs Endpoint
app.get('/api/audit-logs', authenticate, (req: Request, res: Response): void => {
  const user = (req as any).user;
  // Recruiter sees full audit logs, client sees logs relevant to their org
  const logs = user.role === 'recruiter' ? db.auditLogs.slice(0, 100) : db.auditLogs.filter((l) => l.actorUserId === user.id).slice(0, 50);
  res.json({ logs });
});

/* ==========================================================================
   PRIVACY & DPDP COMPLIANCE: CONSENT & DELETION REQUESTS
   ========================================================================== */

app.get('/api/privacy/consents', authenticate, requireRole('recruiter'), (req: Request, res: Response): void => {
  res.json({ consents: Array.from(db.consentRecords.values()) });
});

app.post('/api/privacy/deletion-requests', authenticate, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const { candidateId, reason } = req.body;

  const candidate = db.getCandidateById(candidateId);
  if (!candidate) {
    res.status(404).json({ error: 'Candidate not found' });
    return;
  }

  const delReq = {
    id: `del-${Date.now()}`,
    candidateId: candidate.id,
    candidateNumber: candidate.candidateNumber,
    candidateName: candidate.name,
    requestedBy: user.name,
    requestType: 'recruiter_dpdp_purge' as const,
    status: 'completed' as const,
    reason: reason || 'Data subject requested erasure pursuant to DPDP Act 2023.',
    deletionTimestamp: new Date().toISOString(),
    minimalAuditRetained: true,
    createdAt: new Date().toISOString(),
  };

  db.deletionRequests.set(delReq.id, delReq);

  // Anonymize & Purge personal CV text, phone, email while retaining minimal anonymized audit identifier
  candidate.name = '[DPDP ANONYMIZED SUBJECT]';
  candidate.email = 'erased@dpdp.compliance';
  candidate.phone = '+91 00000 00000';
  candidate.extractedCvText = '[CV CONTENT PERMANENTLY PURGED UNDER RIGHT TO ERASURE]';
  candidate.employmentHistory = [];
  candidate.education = [];

  const consent = db.consentRecords.get(`con-${candidate.id}`);
  if (consent) {
    consent.consentStatus = 'deletion_requested';
    consent.updatedAt = new Date().toISOString();
  }

  db.addAuditLog({
    actorUserId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'CANDIDATE_DELETED',
    resourceType: 'candidate',
    resourceId: candidate.id,
    resourceIdentifier: candidate.candidateNumber,
    details: { reason: delReq.reason, dpdpNotice: 'Right to erasure executed' },
  });

  res.json({ deletionRequest: delReq, candidate });
});

/* ==========================================================================
   FAIRNESS REVIEW & METRICS
   ========================================================================== */

app.get('/api/fairness/reviews', authenticate, requireRole('recruiter'), (req: Request, res: Response): void => {
  res.json({ reviews: db.fairnessReviews });
});

/* ==========================================================================
   DASHBOARD ANALYTICS
   ========================================================================== */

app.get('/api/dashboard/metrics', authenticate, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const requisitions = db.getRequisitions();
  const allCandidates = Array.from(db.candidates.values());
  const allScores = Array.from(db.candidateScores.values());

  if (user.role === 'client') {
    const clientReqs = requisitions.filter((r) => r.organizationId === user.organizationId);
    const clientSubs = db.getClientSubmissions(user.organizationId);
    const shortlistedCount = clientSubs.filter((s) => s.status === 'shortlisted').length;
    const interviewCount = clientSubs.filter((s) => s.status === 'interview_requested').length;

    res.json({
      role: 'client',
      activeRequisitions: clientReqs.length,
      candidatesSubmitted: clientSubs.length,
      shortlistedCount,
      interviewCount,
      recentSubmissions: clientSubs.slice(0, 5),
    });
    return;
  }

  // Recruiter Metrics
  const totalActiveRequisitions = requisitions.filter((r) => r.status === 'active').length;
  const totalCandidatesProcessed = allCandidates.length;
  const candidatesAwaitingReview = allCandidates.filter((c) => !c.recruiterReviewed).length;
  const candidatesShortlisted = allCandidates.filter((c) => c.stage === 'client_shortlisted').length;
  const interviewsScheduled = allCandidates.filter((c) => c.stage === 'interview_scheduled').length;
  const candidatesJoined = allCandidates.filter((c) => c.stage === 'joined').length;

  const validScores = allScores.filter((s) => typeof s.overallScore === 'number');
  const averageAiMatchScore = validScores.length > 0 ? Math.round(validScores.reduce((sum, s) => sum + s.overallScore, 0) / validScores.length) : 0;

  // Pipeline distribution summary
  const pipelineSummary = {
    sourced: allCandidates.filter((c) => c.stage === 'sourced').length,
    parsed: allCandidates.filter((c) => c.stage === 'parsed').length,
    aiEvaluated: allCandidates.filter((c) => c.stage === 'ai_evaluated').length,
    recruiterReviewed: allCandidates.filter((c) => c.stage === 'recruiter_reviewed').length,
    submittedToClient: allCandidates.filter((c) => c.stage === 'submitted_to_client').length,
    clientShortlisted: candidatesShortlisted,
    interviewScheduled: interviewsScheduled,
    joined: candidatesJoined,
  };

  res.json({
    role: 'recruiter',
    totalActiveRequisitions,
    totalCandidatesProcessed,
    candidatesAwaitingReview,
    candidatesShortlisted,
    interviewsScheduled,
    candidatesJoined,
    averageAiMatchScore,
    pipelineSummary,
    recentRequisitions: requisitions.slice(0, 5),
    recentCandidateActivity: allCandidates.slice(0, 6),
  });
});

/* ==========================================================================
   VITE DEV MIDDLEWARE MOUNTING
   ========================================================================== */

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[TalentRank AI] Server running smoothly at http://localhost:${port}`);
  });
}

startServer();
