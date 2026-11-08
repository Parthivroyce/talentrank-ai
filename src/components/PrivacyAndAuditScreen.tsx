import React, { useEffect, useState } from 'react';
import { api } from '../api';
import {
  ShieldCheck,
  Trash2,
  Lock,
  FileCheck,
  AlertTriangle,
  Clock,
  Eye,
  CheckCircle,
  Database,
  History,
} from 'lucide-react';
import { AuditLog, ConsentRecord } from '../types/talentrank';

export const PrivacyAndAuditScreen: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidateId, setSelectedCandidateId] = useState('cnd-91047'); // Arjun Rawat for demo
  const [deletionReason, setDeletionReason] = useState('Candidate requested data subject erasure under DPDP Act 2023 Section 12.');
  const [executingDeletion, setExecutingDeletion] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsRes, consentsRes] = await Promise.all([api.getAuditLogs(), api.getConsents()]);
      setLogs(logsRes.logs || []);
      setConsents(consentsRes.consents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExecuteDeletion = async () => {
    setExecutingDeletion(true);
    setMessage(null);
    try {
      await api.requestDeletion(selectedCandidateId, deletionReason);
      setMessage('Data Subject Erasure successfully executed. Candidate CV and personal contact data permanently purged with minimal legal audit record retained.');
      await loadData();
    } catch (err: any) {
      setMessage('Deletion failed: ' + err.message);
    } finally {
      setExecutingDeletion(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3" />
        <span className="text-sm font-semibold">Loading DPDP compliance audit log...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Digital Personal Data Protection Act (DPDP) 2023 Compliance</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900">
          Candidate Privacy Safeguards, Consent Registry & Immutable Audit Trail
        </h1>
        <p className="text-xs text-slate-500">
          Complete compliance lifecycle: Hiring-purpose limitation, masked PII access, right-to-erasure workflows, and detailed audit logging.
        </p>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          {message}
        </div>
      )}

      {/* TWO SECTIONS: DPDP DELETION WORKFLOW & CONSENT REGISTRY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Right to Erasure / Deletion Request Workflow */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-xs font-bold text-slate-900 uppercase">
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Right to Erasure (DPDP Deletion Request)</span>
          </div>

          <p className="text-xs text-slate-600">
            Execute a legally binding erasure request. The candidate's raw CV file, parsed resume text, phone number, and email will be permanently wiped, retaining only the minimal anonymized audit identifier.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Candidate Record</label>
            <select
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              className="w-full p-2 text-xs border border-slate-300 rounded-lg text-slate-900 bg-white"
            >
              <option value="cnd-91047">CND-91047 • Arjun Rawat (KYC Analyst)</option>
              <option value="cnd-91088">CND-91088 • Pooja Nair (Java Developer)</option>
              <option value="cnd-91095">CND-91095 • Manish Agnihotri (QA Engineer)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Legal Erasure Reason</label>
            <textarea
              value={deletionReason}
              onChange={(e) => setDeletionReason(e.target.value)}
              rows={3}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <button
            onClick={handleExecuteDeletion}
            disabled={executingDeletion}
            className="w-full py-2 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>{executingDeletion ? 'Purging Personal Records...' : 'Execute DPDP Erasure & Anonymization'}</span>
          </button>
        </div>

        {/* Active Consent Records */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900 uppercase">
              Consent Records Registry ({consents.length})
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Purpose: Specific Requisition Evaluation
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {consents.map((con) => (
              <div key={con.id} className="py-2.5 text-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{con.candidateName}</span>
                    <span className="text-[10px] font-mono text-slate-400">[{con.candidateNumber}]</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{con.candidateEmail}</div>
                  <div className="text-[10px] text-slate-400">Version: {con.dpdpNoticeVersion}</div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      con.consentStatus === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {con.consentStatus}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {new Date(con.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* IMMUTABLE AUDIT LOG TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase">
            <History className="w-4 h-4 text-indigo-600" />
            <span>Immutable Governance Audit Trail ({logs.length} events logged)</span>
          </div>
          <span className="text-[11px] text-slate-400">Tamper-evident system log</span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target Resource</th>
                <th className="py-2.5 px-4">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="py-2 px-4 text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2 px-3 text-slate-900 font-sans font-bold">
                    {log.actorName}{' '}
                    <span className="text-[10px] text-slate-400 font-mono">({log.actorRole})</span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-600 font-sans">
                    {log.resourceIdentifier || log.resourceId}
                  </td>
                  <td className="py-2 px-4 text-slate-500 truncate max-w-xs font-sans">
                    {log.details ? JSON.stringify(log.details) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
