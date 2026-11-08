// TalentRank AI — Central Domain Types & Schemas
// Adheres strictly to requirements for Recruiter & Client Hiring Manager workflows

export type UserRole = 'recruiter' | 'client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId?: string; // For client hiring managers, links to their specific client organization
  organizationName?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  industry: string;
  location: string;
  activeRequisitionsCount: number;
  contactEmail: string;
  createdAt: string;
}

export type EmploymentType = 'contract' | 'permanent' | 'full-time' | 'c2h';

export interface Requisition {
  id: string;
  reqNumber: string; // e.g. REQ-2026-081
  title: string;
  organizationId: string;
  organizationName: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  openings: number;
  status: 'active' | 'paused' | 'closed';
  minExperienceYears: number;
  maxExperienceYears: number;
  minCtcLakhs?: number;
  maxCtcLakhs?: number;
  maxNoticeDays: number;
  rawJobDescription: string;
  scorecardId?: string;
  assignedRecruiterId: string;
  assignedRecruiterName: string;
  assignedClientManagerId?: string;
  assignedClientManagerName?: string;
  candidatesCount: number;
  shortlistedCount: number;
  interviewsCount: number;
  joinedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkillRequirement {
  id: string;
  name: string;
  category: 'must-have' | 'nice-to-have';
  weight: number; // 1 to 5 scale or direct percentage
  minYearsExperience?: number;
}

export interface ScoringWeights {
  mustHaveSkills: number; // e.g. 35%
  experienceRelevance: number; // e.g. 25%
  niceToHaveSkills: number; // e.g. 15%
  noticePeriod: number; // e.g. 15%
  locationAndRoleFit: number; // e.g. 10%
}

export interface JobScorecard {
  id: string;
  requisitionId: string;
  jobTitle: string;
  location: string;
  employmentType: EmploymentType;
  minExperienceYears: number;
  maxExperienceYears: number;
  minCtcLakhs?: number;
  maxCtcLakhs?: number;
  maxNoticeDays: number;
  educationalRequirements?: string;
  mustHaveSkills: SkillRequirement[];
  niceToHaveSkills: SkillRequirement[];
  weights: ScoringWeights;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type PipelineStage =
  | 'sourced'
  | 'parsed'
  | 'ai_evaluated'
  | 'recruiter_reviewed'
  | 'submitted_to_client'
  | 'client_shortlisted'
  | 'client_rejected'
  | 'interview_scheduled'
  | 'selected'
  | 'joined'
  | 'rejected'
  | 'withdrawn';

export interface Candidate {
  id: string;
  candidateNumber: string; // e.g. CND-91022
  name: string;
  email: string; // Masked for client role
  phone: string; // Masked for client role
  currentRole: string;
  currentCompany?: string;
  totalExperienceYears: number;
  skills: string[];
  location: string;
  noticePeriodDays: number;
  currentCtcLakhs?: number;
  expectedCtcLakhs?: number;
  education: Array<{
    degree: string;
    institution: string;
    year?: number;
  }>;
  certifications: string[];
  employmentHistory: Array<{
    role: string;
    company: string;
    durationYears?: number;
    description?: string;
  }>;
  extractedCvText: string;
  sourceFilename: string;
  fileMimeType: string;
  fileSizeBytes: number;
  duplicateFingerprint: string;
  requisitionId: string;
  stage: PipelineStage;
  // Recruiter review gate required before client submission
  recruiterReviewed: boolean;
  recruiterNotes?: string;
  recruiterReviewedAt?: string;
  recruiterReviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CriterionEvidence {
  name: string;
  criterionType: 'must_have' | 'nice_to_have' | 'experience' | 'notice_period' | 'location';
  score: number; // 0 to 100
  weight: number;
  status: 'strong_match' | 'partial_match' | 'not_met' | 'uncertain';
  evidenceQuotation: string; // Exact quotation from extracted CV text
  sourceFilename: string;
  pageNumber?: number;
  confidenceScore: number; // 0 to 1
  isVerifiedInCvText: boolean; // Verified against extracted raw text
}

export interface CandidateScore {
  id: string;
  candidateId: string;
  candidateNumber: string;
  requisitionId: string;
  scorecardVersion: number;
  overallScore: number; // 0 to 100
  skillMatchScore: number;
  experienceMatchScore: number;
  noticePeriodScore: number;
  locationFitScore: number;
  criteria: CriterionEvidence[];
  strengths: string[];
  gaps: string[];
  uncertainties: string[];
  recommendation: 'Strong Recommendation' | 'Recruiter Review Recommended' | 'Potential Gaps' | 'Low Fit';
  isStale: boolean;
  computedAt: string;
}

export interface ClientSubmission {
  id: string;
  requisitionId: string;
  candidateId: string;
  candidateNumber: string;
  organizationId: string; // Bound to client org for strict access isolation
  submittedByRecruiterId: string;
  submittedByRecruiterName: string;
  submittedAt: string;
  status: 'pending_review' | 'shortlisted' | 'rejected' | 'interview_requested';
  clientFeedback?: string;
  rejectionReason?: string; // Mandatory if rejected
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface InterviewProposal {
  id: string;
  requisitionId: string;
  candidateId: string;
  organizationId: string;
  proposedByUserId: string;
  proposedByName: string;
  proposedDateTime: string;
  interviewType: 'technical_round_1' | 'technical_round_2' | 'hiring_manager' | 'hr_cultural';
  durationMinutes: number;
  mode: 'virtual_meet' | 'in_person' | 'phone';
  meetingNotes?: string;
  status: 'proposed' | 'confirmed' | 'rescheduled' | 'cancelled';
  createdAt: string;
}

export interface PipelineEvent {
  id: string;
  candidateId: string;
  candidateNumber: string;
  requisitionId: string;
  fromStage: PipelineStage;
  toStage: PipelineStage;
  actorUserId: string;
  actorName: string;
  actorRole: UserRole;
  note?: string;
  timestamp: string;
}

export interface ConsentRecord {
  id: string;
  candidateId: string;
  candidateNumber: string;
  candidateName: string;
  candidateEmail: string;
  consentPurpose: string; // "Hiring and candidate evaluation for specific recruitment requisitions"
  consentStatus: 'active' | 'revoked' | 'deletion_requested';
  dpdpNoticeVersion: string;
  ipAddressMasked: string;
  timestamp: string;
  updatedAt: string;
}

export interface DeletionRequest {
  id: string;
  candidateId: string;
  candidateNumber: string;
  candidateName: string;
  requestedBy: string;
  requestType: 'candidate_self_request' | 'recruiter_dpdp_purge';
  status: 'pending' | 'completed' | 'rejected';
  reason: string;
  deletionTimestamp?: string;
  minimalAuditRetained: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  actorName: string;
  actorRole: UserRole;
  action:
    | 'USER_LOGIN'
    | 'REQUISITION_CREATED'
    | 'REQUISITION_UPDATED'
    | 'SCORECARD_GENERATED'
    | 'SCORECARD_UPDATED'
    | 'CV_UPLOADED'
    | 'CV_PARSED'
    | 'AI_SCORING_EXECUTED'
    | 'CANDIDATE_VIEWED'
    | 'CANDIDATE_REVIEWED'
    | 'CANDIDATE_SUBMITTED_TO_CLIENT'
    | 'CLIENT_VIEWED_CANDIDATE'
    | 'CLIENT_SHORTLISTED'
    | 'CLIENT_REJECTED'
    | 'INTERVIEW_PROPOSED'
    | 'PIPELINE_STAGE_CHANGED'
    | 'CONSENT_GRANTED'
    | 'DELETION_REQUESTED'
    | 'CANDIDATE_DELETED';
  resourceType: 'candidate' | 'requisition' | 'scorecard' | 'clientSubmission' | 'system';
  resourceId: string;
  resourceIdentifier?: string; // e.g. CND-91022 or REQ-2026-081
  details?: Record<string, any>;
  ipAddressMasked?: string;
  timestamp: string;
}

export interface FairnessSample {
  id: string;
  weekEndingDate: string;
  sampleSize: number;
  totalEvaluated: number;
  averageAiScore: number;
  humanOverrideRatePercent: number; // Rate at which recruiter decision differed from AI recommendation
  topDivergenceFactors: string[];
  limitationsDisclaimer: string;
  createdAt: string;
}

export interface ParsingBatchJob {
  id: string;
  totalUploaded: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  duplicateCount: number;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'partially_failed';
  items: Array<{
    filename: string;
    status: 'queued' | 'processing' | 'success' | 'duplicate' | 'failed';
    candidateId?: string;
    candidateNumber?: string;
    error?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
