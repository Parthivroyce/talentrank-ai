import React, { useEffect, useState } from 'react';
import { api } from '../api';
import {
  KanbanSquare,
  Sparkles,
  ArrowRight,
  Clock,
  User,
  CheckCircle2,
  Calendar,
  XCircle,
  FileCheck,
} from 'lucide-react';
import { Candidate, PipelineStage } from '../types/talentrank';

const PIPELINE_COLUMNS: Array<{ stage: PipelineStage; label: string; color: string }> = [
  { stage: 'parsed', label: '1. Parsed', color: 'border-slate-300' },
  { stage: 'ai_evaluated', label: '2. AI Evaluated', color: 'border-indigo-400' },
  { stage: 'recruiter_reviewed', label: '3. Recruiter Reviewed', color: 'border-blue-400' },
  { stage: 'submitted_to_client', label: '4. Submitted to Client', color: 'border-amber-400' },
  { stage: 'client_shortlisted', label: '5. Client Shortlisted', color: 'border-emerald-400' },
  { stage: 'interview_scheduled', label: '6. Interview Scheduled', color: 'border-purple-400' },
  { stage: 'joined', label: '7. Joined & Onboarded', color: 'border-teal-500' },
];

export const RecruitmentPipelineScreen: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingCandidateId, setDraggingCandidateId] = useState<string | null>(null);

  const reqId = 'req-java-noida-01';

  const loadPipeline = async () => {
    try {
      setLoading(true);
      const res = await api.getCandidates(reqId);
      setCandidates(res.candidates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  const handleDragStart = (cndId: string) => {
    setDraggingCandidateId(cndId);
  };

  const handleDrop = async (toStage: PipelineStage) => {
    if (!draggingCandidateId) return;
    try {
      await api.changeStage(draggingCandidateId, toStage, `Moved to ${toStage} on Kanban board`);
      setCandidates((prev) =>
        prev.map((c) => (c.id === draggingCandidateId ? { ...c, stage: toStage } : c))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setDraggingCandidateId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3" />
        <span className="text-sm font-semibold">Loading live pipeline kanban board...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <KanbanSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Interactive Multi-Stage Requisition Pipeline</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Candidate Pipeline & History [REQ-2026-081]
          </h1>
          <p className="text-xs text-slate-500">
            Drag candidates between stages or click move. Every stage transition is immutably recorded in Firestore audit logs.
          </p>
        </div>

        <button
          onClick={loadPipeline}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
        >
          Refresh Board
        </button>
      </div>

      {/* KANBAN BOARD HORIZONTAL SCROLL CONTAINER */}
      <div className="flex gap-4 overflow-x-auto pb-6">
        {PIPELINE_COLUMNS.map((col) => {
          const colCandidates = candidates.filter((c) => c.stage === col.stage);

          return (
            <div
              key={col.stage}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.stage)}
              className="w-72 shrink-0 bg-slate-100/70 border border-slate-200 rounded-xl p-3 flex flex-col max-h-[750px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800">{col.label}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 shadow-2xs">
                  {colCandidates.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                {colCandidates.length === 0 ? (
                  <div className="p-4 rounded-lg border border-dashed border-slate-300 text-center text-xs text-slate-400">
                    No candidates in this stage
                  </div>
                ) : (
                  colCandidates.map((cnd) => (
                    <div
                      key={cnd.id}
                      draggable
                      onDragStart={() => handleDragStart(cnd.id)}
                      className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition-all cursor-grab active:cursor-grabbing text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          {cnd.candidateNumber}
                        </span>
                        {cnd.recruiterReviewed && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            ✓ Reviewed
                          </span>
                        )}
                      </div>

                      <div className="font-bold text-slate-900">{cnd.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {cnd.currentRole} • {cnd.totalExperienceYears}y exp
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                        <span>Notice: {cnd.noticePeriodDays}d</span>
                        <span className="text-indigo-600 font-semibold">{cnd.location}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
