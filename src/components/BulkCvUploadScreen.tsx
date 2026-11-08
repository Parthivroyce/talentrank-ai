import React, { useState } from 'react';
import { api } from '../api';
import {
  UploadCloud,
  FileCheck2,
  AlertTriangle,
  Copy,
  CheckCircle2,
  RefreshCw,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileUp,
} from 'lucide-react';
import { ScreenType } from './AppLayout';

interface BulkCvUploadScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

export const BulkCvUploadScreen: React.FC<BulkCvUploadScreenProps> = ({ onNavigate }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    // Validate PDF and DOCX
    const valid = files.filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ext === 'pdf' || ext === 'docx' || ext === 'txt';
    });
    setSelectedFiles((prev) => [...prev, ...valid]);
  };

  const handleUploadBatch = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setUploadResults(null);
    try {
      const reqId = 'req-java-noida-01'; // Default Senior Java Developer requisition
      const res = await api.uploadCvs(reqId, selectedFiles);
      setUploadResults(res);
      setSelectedFiles([]);
    } catch (err: any) {
      console.error(err);
      alert('Upload failed: ' + (err.message || 'Server error'));
    } finally {
      setUploading(false);
    }
  };

  // Preload Sample Batch Candidates Button
  const handlePreloadBatch = () => {
    // Create fictional File mocks for testing
    const sample1 = new File(
      [
        `Candidate: Ananya Gupta\nRole: Java Microservices Specialist\nExperience: 6.0 years\nSkills: Java, Spring Boot, Microservices, PostgreSQL\nLocation: Noida Sector 62\nNotice Period: 45 days\nEmail: ananya.gupta@techmail.example.com\nPhone: +91 98111 88200`,
      ],
      'Ananya_Gupta_Java_6Y.pdf',
      { type: 'application/pdf' }
    );
    const sample2 = new File(
      [
        `Candidate: Saurabh Saxena\nRole: Senior Backend Engineer\nExperience: 7.0 years\nSkills: Java, Spring Boot, Kafka, AWS, Docker\nLocation: Noida\nNotice Period: 30 days\nEmail: saurabh.saxena@cloudmail.org\nPhone: +91 97180 55123`,
      ],
      'Saurabh_Saxena_Java_7Y.docx',
      { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
    );
    const duplicateSample = new File(
      [
        `Candidate: Ritika Bansal\nRole: Senior Java Developer\nExperience: 6.5 years\nEmail: ritika.bansal@techmail.example.com\nPhone: +91 98101 24590`,
      ],
      'Ritika_Bansal_Duplicate_Check.pdf',
      { type: 'application/pdf' }
    );

    setSelectedFiles([sample1, sample2, duplicateSample]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
            <span>High-Volume Asynchronous CV Processing</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Bulk Resume Upload & Parsing Engine</h1>
          <p className="text-xs text-slate-500">
            Accepts PDF and DOCX files. Automatically extracts candidate attributes, detects duplicates, and maps to REQ-2026-081.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePreloadBatch}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
        >
          <FileUp className="w-4 h-4 text-indigo-600" />
          <span>Load Sample Batch with Duplicates</span>
        </button>
      </div>

      {/* DROPZONE CARD */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`bg-white border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragActive ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">
          Drag and drop multiple resumes here, or browse
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Supports .PDF and .DOCX format. Scaled for batches up to 500 files with bounded concurrency.
        </p>

        <label className="mt-4 inline-block cursor-pointer">
          <span className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors">
            Select Resume Files
          </span>
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
      </div>

      {/* STAGED FILES QUEUE */}
      {selectedFiles.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900 uppercase">
              Staged Files in Upload Queue ({selectedFiles.length})
            </span>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-xs text-rose-600 hover:underline"
            >
              Clear Queue
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-slate-800">{file.name}</span>
                  <span className="text-[10px] text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  Queued for Processing
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Files will be parsed asynchronously and evaluated against the Senior Java Scorecard.
            </span>
            <button
              onClick={handleUploadBatch}
              disabled={uploading}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Batch Resumes...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Process & Rank Batch</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* UPLOAD & PROCESSING RESULTS FEEDBACK */}
      {uploadResults && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Batch Processing Execution Summary</span>
            </div>
            <button
              onClick={() => onNavigate('candidates')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
            >
              View Ranked Candidates Table <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500">Total Uploaded</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{uploadResults.totalUploaded}</div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="text-xs text-emerald-700 font-semibold">Processed Successfully</div>
              <div className="text-xl font-bold text-emerald-800 mt-1">{uploadResults.processed}</div>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="text-xs text-amber-700 font-semibold">Duplicates Detected</div>
              <div className="text-xl font-bold text-amber-800 mt-1">{uploadResults.duplicates}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500">Failed / Unreadable</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{uploadResults.failed}</div>
            </div>
          </div>

          {/* Duplicates Detail List if detected */}
          {uploadResults.duplicateDetails && uploadResults.duplicateDetails.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Duplicate Records Preserved Without Overwrite:</span>
              </div>
              <ul className="space-y-1 text-amber-800 list-disc list-inside">
                {uploadResults.duplicateDetails.map((dup: any, i: number) => (
                  <li key={i}>
                    <strong>{dup.filename}</strong> matches existing record{' '}
                    <span className="font-mono font-bold">{dup.candidateNumber}</span> ({dup.name}) — {dup.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Newly created candidates preview */}
          {uploadResults.candidates && uploadResults.candidates.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-900 mb-2 block">
                Newly Ingested Candidate Profiles:
              </span>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {uploadResults.candidates.map((c: any) => (
                  <div key={c.id} className="p-3 bg-white flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 mr-2">{c.name}</span>
                      <span className="font-mono text-slate-500 text-[10px] mr-2">[{c.candidateNumber}]</span>
                      <span className="text-slate-500">{c.currentRole} • {c.totalExperienceYears}y exp • {c.noticePeriodDays}d notice</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      ✓ AI Evaluated
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DPDP Compliance Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <span className="font-bold text-slate-900">Privacy by Design (DPDP Act 2023): </span>
          Uploaded CV files are stored in an isolated, authenticated document store. Contact information is strictly masked
          prior to any client manager access, and data subject consent records are initialized automatically upon ingest.
        </div>
      </div>
    </div>
  );
};
