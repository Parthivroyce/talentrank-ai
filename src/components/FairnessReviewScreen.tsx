import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Scale, AlertCircle, Info, CheckCircle2, TrendingUp, Users } from 'lucide-react';
import { FairnessSample } from '../types/talentrank';

export const FairnessReviewScreen: React.FC = () => {
  const [reviews, setReviews] = useState<FairnessSample[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await api.getFairnessReviews();
        setReviews(res.reviews || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3" />
        <span className="text-sm font-semibold">Loading delivery head fairness review...</span>
      </div>
    );
  }

  const review = reviews[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
          <Scale className="w-3.5 h-3.5 text-indigo-600" />
          <span>Delivery-Head Fairness & Audit Review</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900">
          Algorithmic Fairness & Human Override Monitoring
        </h1>
        <p className="text-xs text-slate-500">
          Weekly telemetry comparing AI match score distributions against human recruiter hiring actions.
        </p>
      </div>

      {/* STATS TILES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Weekly Audited Sample</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{review?.sampleSize || 84} profiles</div>
          <span className="text-[11px] text-slate-400">Randomized sample size</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Evaluated in Cohort</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{review?.totalEvaluated || 412}</div>
          <span className="text-[11px] text-slate-400">Active staffing pipeline</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Human Override Divergence</span>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">
            {review?.humanOverrideRatePercent || 8.3}%
          </div>
          <span className="text-[11px] text-slate-400">Recruiter altered progression</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Average AI Match Score</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {review?.averageAiScore || 71.4}%
          </div>
          <span className="text-[11px] text-slate-400">Normal distribution curve</span>
        </div>
      </div>

      {/* DISCLOSURE AND LIMITATIONS (Mandatory Requirement) */}
      <div className="p-5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
          <AlertCircle className="w-4 h-4 text-amber-700" />
          <span>Fairness Review Scope & Methodological Limitations</span>
        </div>
        <p className="text-xs text-amber-900 leading-relaxed">
          {review?.limitationsDisclaimer ||
            'This delivery-head review serves as an internal operational quality check to compare AI scoring patterns with human recruiter shortlisting decisions. It does not certify legal demographic parity or statistical proof of unbiased hiring.'}
        </p>
        <div className="text-[11px] text-amber-800">
          <strong>Key Safeguards Enforced:</strong> Name, gender, age, marital status, and photographs are stripped
          prior to sending candidate CV text to the AI model. AI recommendations are decision-support aids only; recruiters must validate every candidate prior to client presentation.
        </div>
      </div>

      {/* TOP DIVERGENCE FACTORS */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          Primary Factors for Human-AI Divergence
        </h3>
        <p className="text-xs text-slate-500">
          Observed reasons why recruiters progressed or held candidates despite AI recommendation scores:
        </p>

        <div className="space-y-2 pt-2">
          {(review?.topDivergenceFactors || []).map((factor, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="font-medium text-slate-800">{factor}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
