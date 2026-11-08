// TalentRank AI — Central API Client for React UI
// Automatically sends the active user role token, provides typed responses, and connects to server

import {
  User,
  Requisition,
  JobScorecard,
  Candidate,
  CandidateScore,
  ClientSubmission,
  AuditLog,
  ConsentRecord,
  DeletionRequest,
  FairnessSample,
} from './types/talentrank';

class ApiClient {
  private currentUserId: string = 'usr-recruiter-01'; // Default active session

  setUserId(id: string) {
    this.currentUserId = id;
    localStorage.setItem('talentrank_user_id', id);
  }

  getUserId(): string {
    const saved = localStorage.getItem('talentrank_user_id');
    return saved || this.currentUserId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('x-user-id', this.getUserId());
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error || `HTTP error ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string): Promise<{ user: User; token: string }> {
    const res = await this.request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    this.setUserId(res.user.id);
    return res;
  }

  async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/me');
  }

  // Dashboard
  async getDashboardMetrics(): Promise<any> {
    return this.request<any>('/api/dashboard/metrics');
  }

  // Requisitions
  async getRequisitions(): Promise<{ requisitions: Requisition[] }> {
    return this.request<{ requisitions: Requisition[] }>('/api/requisitions');
  }

  async getRequisition(id: string): Promise<{ requisition: Requisition; scorecard?: JobScorecard }> {
    return this.request<{ requisition: Requisition; scorecard?: JobScorecard }>(`/api/requisitions/${id}`);
  }

  async createRequisition(data: any): Promise<{ requisition: Requisition }> {
    return this.request<{ requisition: Requisition }>('/api/requisitions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // AI JD Scorecard Extraction
  async extractScorecardFromJd(rawJobDescription: string): Promise<{ extracted: any }> {
    return this.request<{ extracted: any }>('/api/requisitions/extract-scorecard', {
      method: 'POST',
      body: JSON.stringify({ rawJobDescription }),
    });
  }

  async saveScorecard(reqId: string, scorecardData: any): Promise<{ scorecard: JobScorecard }> {
    return this.request<{ scorecard: JobScorecard }>(`/api/requisitions/${reqId}/scorecard`, {
      method: 'POST',
      body: JSON.stringify(scorecardData),
    });
  }

  // Candidates & Upload
  async getCandidates(reqId: string): Promise<{ candidates: Candidate[]; scores?: Record<string, CandidateScore>; submissions?: ClientSubmission[] }> {
    return this.request<{ candidates: Candidate[]; scores?: Record<string, CandidateScore>; submissions?: ClientSubmission[] }>(
      `/api/requisitions/${reqId}/candidates`
    );
  }

  async getCandidate(id: string): Promise<{ candidate: Candidate; score?: CandidateScore; history?: any[]; consent?: ConsentRecord }> {
    return this.request<{ candidate: Candidate; score?: CandidateScore; history?: any[]; consent?: ConsentRecord }>(`/api/candidates/${id}`);
  }

  async uploadCvs(reqId: string, files: File[]): Promise<any> {
    const formData = new FormData();
    for (const f of files) {
      formData.append('files', f);
    }
    return this.request<any>(`/api/requisitions/${reqId}/upload-cvs`, {
      method: 'POST',
      body: formData,
    });
  }

  async triggerAiScoring(candidateId: string): Promise<{ score: CandidateScore }> {
    return this.request<{ score: CandidateScore }>(`/api/candidates/${candidateId}/score`, {
      method: 'POST',
    });
  }

  async recruiterReview(candidateId: string, notes: string): Promise<{ candidate: Candidate }> {
    return this.request<{ candidate: Candidate }>(`/api/candidates/${candidateId}/recruiter-review`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async submitToClient(candidateId: string): Promise<{ submission: ClientSubmission; candidate: Candidate }> {
    return this.request<{ submission: ClientSubmission; candidate: Candidate }>(`/api/candidates/${candidateId}/submit-to-client`, {
      method: 'POST',
    });
  }

  // Client Portal Actions
  async clientShortlist(candidateId: string, feedback?: string): Promise<any> {
    return this.request<any>(`/api/client/candidates/${candidateId}/shortlist`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    });
  }

  async clientReject(candidateId: string, rejectionReason: string, feedback?: string): Promise<any> {
    return this.request<any>(`/api/client/candidates/${candidateId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason, feedback }),
    });
  }

  async clientProposeInterview(candidateId: string, data: any): Promise<any> {
    return this.request<any>(`/api/client/candidates/${candidateId}/propose-interview`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Pipeline Transition
  async changeStage(candidateId: string, toStage: string, note?: string): Promise<any> {
    return this.request<any>(`/api/candidates/${candidateId}/stage`, {
      method: 'POST',
      body: JSON.stringify({ toStage, note }),
    });
  }

  // Audit, Privacy, Fairness
  async getAuditLogs(): Promise<{ logs: AuditLog[] }> {
    return this.request<{ logs: AuditLog[] }>('/api/audit-logs');
  }

  async getConsents(): Promise<{ consents: ConsentRecord[] }> {
    return this.request<{ consents: ConsentRecord[] }>('/api/privacy/consents');
  }

  async requestDeletion(candidateId: string, reason: string): Promise<any> {
    return this.request<any>('/api/privacy/deletion-requests', {
      method: 'POST',
      body: JSON.stringify({ candidateId, reason }),
    });
  }

  async getFairnessReviews(): Promise<{ reviews: FairnessSample[] }> {
    return this.request<{ reviews: FairnessSample[] }>('/api/fairness/reviews');
  }
}

export const api = new ApiClient();
