import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  CheckCircle,
  XCircle,
  Calendar,
  Sparkles,
  Shield,
  FileText,
  Clock,
  Quote,
  Eye,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { Candidate, CandidateScore, ClientSubmission } from '../types/talentrank';

export const ClientPortalScreen: React.FC = () => {
  const { currentUser } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [submissions, setSubmissions] = useState<ClientSubmission[]>([]);
  const [scores, setScores] = useState<Record<string, CandidateScore>>({});
  const [loading, setLoading] = useState(true);

  // Active interaction modals
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewDate, setInterviewDate] = useState('2026-02-24T14:30');
  const [interviewType, setInterviewType] = useState('technical_round_1');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const reqId = 'req-java-noida-01';

  const loadClientData = async () => {
    setLoading(true);
    try {
      const res = await api.getCandidates(reqId);
      setCandidates(res.candidates || []);
      setSubmissions(res.submissions || []);
      if (res.scores) setScores(res.scores);
    } catch (err: any) {
      console.error('Client portal data load error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientData();
  }, [currentUser]);

  const handleShortlist = async (candidateId: string) => {
    setActionLoading(true);
    setFeedbackMessage(null);
    try {
      await api.clientShortlist(candidateId, 'Approved for technical evaluation by hiring manager');
      setFeedbackMessage({ type: 'success', text: 'Candidate successfully shortlisted!' });
      await loadClientData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Shortlisting failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCandidate) return;
    if (!rejectionReason.trim()) {
      alert('Mandatory Rule: A clear rejection reason is required.');
      return;
    }
    setActionLoading(true);
    setFeedbackMessage(null);
    try {
      await api.clientReject(selectedCandidate.id, rejectionReason);
      setFeedbackMessage({ type: 'success', text: `Candidate ${selectedCandidate.candidateNumber} marked as rejected.` });
      setRejectModalOpen(false);
      setRejectionReason('');
      await loadClientData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Rejection failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleProposeInterview = async () => {
    if (!selectedCandidate) return;
    setActionLoading(true);
    setFeedbackMessage(null);
    try {
      await api.clientProposeInterview(selectedCandidate.id, {
        proposedDateTime: interviewDate,
        interviewType,
        durationMinutes: 60,
        mode: 'virtual_meet',
        meetingNotes: interviewNotes,
      });
      setFeedbackMessage({
        type: 'success',
        text: `Interview scheduled for candidate ${selectedCandidate.candidateNumber}!`,
      });
      setInterviewModalOpen(false);
      await loadClientData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Interview scheduling failed' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3" />
        <span className="text-sm font-semibold">Loading secure hiring manager portal...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Client Org Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              Client Portal
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs font-semibold text-slate-700">Apex Global Financial Services</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Hiring Manager Candidate Review Gateway
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review pre-screened, recruiter-verified candidates submitted for Senior Java Developer [REQ-2026-081].
          </p>
        </div>

        {/* DPDP PII Masking Badge */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="font-bold text-slate-900">Strict PII Masking Enforced</div>
            <div className="text-[11px] text-slate-500">Contact details concealed per DPDP Act 2023</div>
          </div>
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* CANDIDATES REVIEW GRID */}
      {candidates.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No Candidates Submitted Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Recruiter Priyanka Sharma will review matching profiles and submit them to your portal.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((cnd) => {
            const sub = submissions.find((s) => s.candidateId === cnd.id);
            const score = scores[cnd.id];

            return (
              <div
                key={cnd.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  {/* Top Bar: ID & Submission Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {cnd.candidateNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        sub?.status === 'shortlisted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sub?.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : sub?.status === 'interview_requested'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sub?.status ? sub.status.replace('_', ' ') : 'Pending Review'}
                    </span>
                  </div>

                  {/* Role & Name */}
                  <h3 className="text-base font-bold text-slate-900">{cnd.name}</h3>
                  <div className="text-xs text-slate-500 mt-0.5 font-medium">
                    {cnd.currentRole} • {cnd.totalExperienceYears} yrs experience
                  </div>

                  {/* Masked Contact Details Box (Mandatory Requirement) */}
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Masked Email:</span>
                      <span className="font-mono text-slate-700">{cnd.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Masked Phone:</span>
                      <span className="font-mono text-slate-700">{cnd.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Notice Period:</span>
                      <span className="font-bold text-slate-800">{cnd.noticePeriodDays} days</span>
                    </div>
                  </div>

                  {/* AI Match Score Badge */}
                  {score && (
                    <div className="mt-3 p-3 rounded-lg bg-indigo-50/60 border border-indigo-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>AI Match Score</span>
                        </span>
                        <span className="text-sm font-black text-indigo-700">
                          {score.overallScore}%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">{score.recommendation}</div>
                    </div>
                  )}

                  {/* Key Skills Tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {cnd.skills.slice(0, 5).map((skill, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions Button Bar */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleShortlist(cnd.id)}
                    disabled={actionLoading || sub?.status === 'shortlisted'}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Shortlist</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedCandidate(cnd);
                      setInterviewModalOpen(true);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Interview</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedCandidate(cnd);
                      setRejectModalOpen(true);
                    }}
                    disabled={actionLoading || sub?.status === 'rejected'}
                    className="py-1.5 px-3 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REJECT MODAL WITH MANDATORY REASON */}
      {rejectModalOpen && selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <XCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">
                Reject Candidate [{selectedCandidate.candidateNumber}]
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Per staffing governance standards, a specific, documented rejection reason is mandatory for client feedback.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mandatory Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="e.g. Notice period exceeds our hard 45-day joining deadline, or lacks hands-on Kafka event stream production experience."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
              >
                {actionLoading ? 'Saving...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERVIEW PROPOSAL MODAL */}
      {interviewModalOpen && selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-indigo-600">
              <Calendar className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">
                Propose Technical Interview [{selectedCandidate.candidateNumber}]
              </h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Proposed Date & Time</label>
              <input
                type="datetime-local"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Interview Round</label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg text-slate-900 bg-white"
              >
                <option value="technical_round_1">Round 1: Core Java & Microservices Deep Dive</option>
                <option value="technical_round_2">Round 2: Architecture & System Design</option>
                <option value="hiring_manager">Round 3: Hiring Manager Cultural Alignment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Focus Notes for Interviewer</label>
              <textarea
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Test Spring Boot 3 migration, transaction management, and Docker deployment."
                className="w-full p-2 text-xs border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInterviewModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProposeInterview}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
              >
                {actionLoading ? 'Scheduling...' : 'Schedule Interview'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
