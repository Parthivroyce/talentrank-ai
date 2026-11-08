import React, { useEffect, useState } from 'react';
import { api } from '../api';
import {
  Search,
  Filter,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  Eye,
  FileText,
  UserCheck,
  ChevronDown,
  Quote,
  Clock,
  MapPin,
  Briefcase,
  AlertCircle,
  HelpCircle,
  Shield,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { Candidate, CandidateScore } from '../types/talentrank';

export const CandidateRankingScreen: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [scores, setScores] = useState<Record<string, CandidateScore>>({});
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterNotice, setFilterNotice] = useState('all');
  const [sortBy, setSortBy] = useState<'score' | 'experience' | 'notice'>('score');

  // Modal / Drawer states
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [activeScore, setActiveScore] = useState<CandidateScore | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const reqId = 'req-java-noida-01'; // Default Senior Java Requisition

  const fetchCandidatesData = async () => {
    try {
      setLoading(true);
      const res = await api.getCandidates(reqId);
      setCandidates(res.candidates || []);
      setScores(res.scores || {});
    } catch (err) {
      console.error('Failed to load candidate rankings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidatesData();
  }, []);

  const openCandidateDetail = (cnd: Candidate) => {
    setSelectedCandidate(cnd);
    setActiveScore(scores[cnd.id] || null);
    setReviewNotes(cnd.recruiterNotes || '');
  };

  const handleRecruiterReview = async () => {
    if (!selectedCandidate) return;
    setActionLoading(true);
    setStatusMessage(null);
    try {
      const { candidate: updated } = await api.recruiterReview(selectedCandidate.id, reviewNotes);
      setSelectedCandidate(updated);
      setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setReviewModalOpen(false);
      setStatusMessage({ type: 'success', text: 'Candidate marked as Recruiter Reviewed & verified!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Review failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitToClient = async () => {
    if (!selectedCandidate) return;
    setActionLoading(true);
    setStatusMessage(null);
    try {
      const { candidate: updated } = await api.submitToClient(selectedCandidate.id);
      setSelectedCandidate(updated);
      setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setStatusMessage({
        type: 'success',
        text: `Submitted candidate ${selectedCandidate.candidateNumber} to Apex Global Financial Services!`,
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Submission failed' });
    } finally {
      setActionLoading(false);
    }
  };

  // Filter & Sort Logic
  const filteredCandidates = candidates
    .filter((c) => {
      const q = searchQuery.toLowerCase();
      const nameMatch = c.name.toLowerCase().includes(q) || c.candidateNumber.toLowerCase().includes(q);
      const skillMatch = c.skills.some((s) => s.toLowerCase().includes(q));
      const textMatch = nameMatch || skillMatch;

      const roleMatch = filterRole === 'all' || c.currentRole.toLowerCase().includes(filterRole.toLowerCase());
      const noticeMatch =
        filterNotice === 'all'
          ? true
          : filterNotice === '30'
          ? c.noticePeriodDays <= 30
          : filterNotice === '60'
          ? c.noticePeriodDays <= 60
          : c.noticePeriodDays > 60;

      return textMatch && roleMatch && noticeMatch;
    })
    .sort((a, b) => {
      const scoreA = scores[a.id]?.overallScore ?? 0;
      const scoreB = scores[b.id]?.overallScore ?? 0;

      if (sortBy === 'score') return scoreB - scoreA;
      if (sortBy === 'experience') return b.totalExperienceYears - a.totalExperienceYears;
      if (sortBy === 'notice') return a.noticePeriodDays - b.noticePeriodDays;
      return 0;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3" />
        <span className="text-sm font-semibold">Ranking candidates with verifiable citations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Fairness Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Explainable AI Candidate Ranking • Gemini Powered</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Senior Java Developer Candidates [REQ-2026-081]
          </h1>
          <p className="text-xs text-slate-500">
            Every match score includes verbatim supporting quotations from the candidate's CV text. Low-scoring candidates remain 100% searchable.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-900">{filteredCandidates.length} Candidates</div>
            <div className="text-[10px] text-slate-400">All rankings derived dynamically</div>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name, ID (e.g. CND-91022), or skills (e.g. Java, Spring Boot, Kafka)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-transparent border-none text-slate-700 text-xs focus:ring-0 cursor-pointer font-medium"
            >
              <option value="all">All Domains / Roles</option>
              <option value="Java">Java Developers</option>
              <option value="KYC">KYC & Compliance</option>
              <option value="QA">QA Engineers</option>
              <option value="Python">Python</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterNotice}
              onChange={(e) => setFilterNotice(e.target.value)}
              className="bg-transparent border-none text-slate-700 text-xs focus:ring-0 cursor-pointer font-medium"
            >
              <option value="all">Any Notice Period</option>
              <option value="30">Immediate to 30 Days</option>
              <option value="60">Up to 60 Days</option>
              <option value="90">&gt; 60 Days</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-none text-slate-700 text-xs focus:ring-0 cursor-pointer font-medium"
            >
              <option value="score">Sort: Highest Match Score</option>
              <option value="experience">Sort: Total Experience</option>
              <option value="notice">Sort: Shortest Notice</option>
            </select>
          </div>
        </div>
      </div>

      {/* CANDIDATES TABLE & DETAIL DRAWER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Candidates Table (7 cols on desktop or 12 when no detail open) */}
        <div className={`${selectedCandidate ? 'lg:col-span-7' : 'lg:col-span-12'} transition-all`}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Candidate Profile</th>
                    <th className="py-3 px-3">Role & Experience</th>
                    <th className="py-3 px-3">Notice</th>
                    <th className="py-3 px-3">AI Match Score</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCandidates.map((cnd) => {
                    const score = scores[cnd.id];
                    const isSelected = selectedCandidate?.id === cnd.id;

                    return (
                      <tr
                        key={cnd.id}
                        onClick={() => openCandidateDetail(cnd)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0">
                              {cnd.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                                {cnd.name}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">
                                {cnd.candidateNumber}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{cnd.currentRole}</div>
                          <div className="text-[11px] text-slate-500">
                            {cnd.totalExperienceYears} yrs • {cnd.location}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              cnd.noticePeriodDays <= 30
                                ? 'bg-emerald-50 text-emerald-700'
                                : cnd.noticePeriodDays <= 60
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {cnd.noticePeriodDays} days
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          {score ? (
                            <div className="flex items-center gap-2">
                              <div
                                className={`text-sm font-extrabold px-2 py-0.5 rounded ${
                                  score.overallScore >= 85
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : score.overallScore >= 60
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {score.overallScore}%
                              </div>
                              <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                                {score.recommendation}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Pending AI</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              cnd.stage === 'joined'
                                ? 'bg-teal-100 text-teal-800'
                                : cnd.stage === 'submitted_to_client'
                                ? 'bg-indigo-100 text-indigo-800'
                                : cnd.stage === 'client_shortlisted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : cnd.stage === 'interview_scheduled'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {cnd.stage.replace('_', ' ')}
                          </span>
                          <div className="text-[9px] text-slate-400 mt-0.5">
                            {cnd.recruiterReviewed ? '✓ Verified' : 'Unreviewed'}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openCandidateDetail(cnd);
                            }}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                            View Evidence
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Candidate Detail & Evidence Panel (5 cols) */}
        {selectedCandidate && (
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{selectedCandidate.name}</h3>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {selectedCandidate.candidateNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedCandidate.currentRole} • {selectedCandidate.totalExperienceYears} yrs experience
                </p>
              </div>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* OVERALL MATCH SCORE CARD */}
            {activeScore && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    AI Match Evaluation
                  </span>
                  <span
                    className={`text-lg font-black px-2.5 py-0.5 rounded ${
                      activeScore.overallScore >= 85
                        ? 'bg-emerald-100 text-emerald-800'
                        : activeScore.overallScore >= 60
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {activeScore.overallScore} / 100
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-800 mb-2">
                  Recommendation: {activeScore.recommendation}
                </div>

                {/* Criterion Breakdown Bars */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Must-Have Skills:</span>
                    <span className="font-bold">{activeScore.skillMatchScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Experience Fit:</span>
                    <span className="font-bold">{activeScore.experienceMatchScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Notice Period:</span>
                    <span className="font-bold">{activeScore.noticePeriodScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location Fit:</span>
                    <span className="font-bold">{activeScore.locationFitScore}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* CRITICAL EVIDENCE RULE SECTION */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Verifiable Quotations from CV Text</span>
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  ✓ Verified In Text
                </span>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {activeScore?.criteria.map((crit, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{crit.name}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          crit.score >= 80
                            ? 'bg-emerald-50 text-emerald-700'
                            : crit.score >= 50
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {crit.score}% • {crit.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="p-2 rounded bg-slate-50 border-l-2 border-indigo-500 text-[11px] font-mono text-slate-700 italic">
                      "{crit.evidenceQuotation}"
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Source: {crit.sourceFilename}</span>
                      <span>Confidence: {(crit.confidenceScore * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RECRUITER ACTIONS GATEWAY */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase">Recruiter Review Status</span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    selectedCandidate.recruiterReviewed
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedCandidate.recruiterReviewed ? '✓ Verified by Recruiter' : 'Review Required'}
                </span>
              </div>

              {selectedCandidate.recruiterNotes && (
                <div className="p-2.5 rounded-lg bg-slate-50 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900 block mb-0.5">Recruiter Assessment:</span>
                  {selectedCandidate.recruiterNotes}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(true)}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{selectedCandidate.recruiterReviewed ? 'Edit Review Notes' : 'Review & Approve'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitToClient}
                  disabled={!selectedCandidate.recruiterReviewed || actionLoading}
                  className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to Client</span>
                </button>
              </div>

              {!selectedCandidate.recruiterReviewed && (
                <p className="text-[10px] text-amber-600 font-medium">
                  Compliance Rule: Every candidate must be reviewed by recruiter before submission to client.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* RECRUITER REVIEW MODAL */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Recruiter Profile Review & Validation
            </h3>
            <p className="text-xs text-slate-500">
              Confirm candidate claims, verified quotations, and add notes before client submission.
            </p>

            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={4}
              placeholder="e.g. Verified candidate hands-on experience in Java 17 and Spring Boot microservices. Notice period is 60 days which strictly fits client requirements."
              className="w-full p-3 text-xs border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-600"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecruiterReview}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
              >
                {actionLoading ? 'Saving...' : 'Confirm Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
