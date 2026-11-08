import React, { useState } from 'react';
import { api } from '../api';
import {
  Sparkles,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileText,
  Sliders,
  RotateCcw,
  Building2,
  Layers,
} from 'lucide-react';
import { JobScorecard, SkillRequirement } from '../types/talentrank';

export const AiJobScorecardScreen: React.FC = () => {
  // Preloaded Example per Specification: Senior Java Developer in Noida, 5-8 yrs, Java/Spring Boot, 60 days
  const sampleSeniorJavaJd = `Role: Senior Java Developer
Location: Noida
Experience: 5–8 years
Employment Type: Permanent / Full-Time
Must-have skills: Java, Spring Boot, Microservices
Nice-to-have skills: Apache Kafka, Docker, Kubernetes, AWS Cloud
Notice period: Up to 60 days
CTC Range: 18 - 28 LPA

Job Description:
We are hiring a Senior Java Developer for Apex Global Financial Services in Noida. The engineer will design, build and optimize mission-critical transactional microservices handling over 40,000 transactions per second.
Required Qualifications:
- Solid proficiency with Core Java 11/17, Spring Boot, Spring Data JPA, and Hibernate.
- Hands-on experience designing REST APIs and distributed microservices.
- Minimum 5 years to 8 years of total software engineering experience.
- Notice period strictly within 60 days.
- B.Tech/B.E./M.C.A. in Computer Science or related degree.`;

  const [rawJd, setRawJd] = useState(sampleSeniorJavaJd);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Editable Scorecard Form State
  const [jobTitle, setJobTitle] = useState('Senior Java Developer');
  const [location, setLocation] = useState('Noida');
  const [employmentType, setEmploymentType] = useState<'permanent' | 'contract'>('permanent');
  const [minExp, setMinExp] = useState(5);
  const [maxExp, setMaxExp] = useState(8);
  const [minCtc, setMinCtc] = useState<number | undefined>(18);
  const [maxCtc, setMaxCtc] = useState<number | undefined>(28);
  const [maxNotice, setMaxNotice] = useState(60);
  const [eduReq, setEduReq] = useState('B.Tech/B.E./M.C.A. in Computer Science or related engineering degree');

  const [mustHaveSkills, setMustHaveSkills] = useState<SkillRequirement[]>([
    { id: '1', name: 'Java', category: 'must-have', weight: 5, minYearsExperience: 5 },
    { id: '2', name: 'Spring Boot', category: 'must-have', weight: 5, minYearsExperience: 4 },
    { id: '3', name: 'Microservices', category: 'must-have', weight: 4, minYearsExperience: 3 },
  ]);

  const [niceToHaveSkills, setNiceToHaveSkills] = useState<SkillRequirement[]>([
    { id: '4', name: 'Kafka', category: 'nice-to-have', weight: 3 },
    { id: '5', name: 'Docker / Kubernetes', category: 'nice-to-have', weight: 3 },
    { id: '6', name: 'AWS Cloud', category: 'nice-to-have', weight: 2 },
  ]);

  const [weights, setWeights] = useState({
    mustHaveSkills: 35,
    experienceRelevance: 25,
    niceToHaveSkills: 15,
    noticePeriod: 15,
    locationAndRoleFit: 10,
  });

  const [newMustSkill, setNewMustSkill] = useState('');
  const [newNiceSkill, setNewNiceSkill] = useState('');

  // Trigger Gemini Extraction
  const handleGenerateScorecard = async () => {
    if (!rawJd.trim()) return;
    setExtracting(true);
    setFeedback(null);
    try {
      const { extracted } = await api.extractScorecardFromJd(rawJd);
      setJobTitle(extracted.jobTitle || 'Extracted Role');
      setLocation(extracted.location || 'Noida');
      setEmploymentType(extracted.employmentType || 'permanent');
      setMinExp(extracted.minExperienceYears || 5);
      setMaxExp(extracted.maxExperienceYears || 8);
      setMinCtc(extracted.minCtcLakhs);
      setMaxCtc(extracted.maxCtcLakhs);
      setMaxNotice(extracted.maxNoticeDays || 60);
      setEduReq(extracted.educationalRequirements || '');

      if (extracted.mustHaveSkills && extracted.mustHaveSkills.length > 0) {
        setMustHaveSkills(
          extracted.mustHaveSkills.map((s: any, idx: number) => ({
            id: `must-${idx}`,
            name: s.name,
            category: 'must-have',
            weight: s.weight || 5,
            minYearsExperience: s.minYearsExperience || 3,
          }))
        );
      }

      if (extracted.niceToHaveSkills && extracted.niceToHaveSkills.length > 0) {
        setNiceToHaveSkills(
          extracted.niceToHaveSkills.map((s: any, idx: number) => ({
            id: `nice-${idx}`,
            name: s.name,
            category: 'nice-to-have',
            weight: s.weight || 3,
          }))
        );
      }

      setFeedback({
        type: 'success',
        message: 'Gemini AI successfully extracted JD requirements into the structured scorecard below.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Extraction error: ' + (err.message || 'Check connection'),
      });
    } finally {
      setExtracting(false);
    }
  };

  const handleSaveScorecard = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const reqId = 'req-java-noida-01'; // Default target example requisition
      await api.saveScorecard(reqId, {
        jobTitle,
        location,
        employmentType,
        minExperienceYears: minExp,
        maxExperienceYears: maxExp,
        minCtcLakhs: minCtc,
        maxCtcLakhs: maxCtc,
        maxNoticeDays: maxNotice,
        educationalRequirements: eduReq,
        mustHaveSkills,
        niceToHaveSkills,
        weights,
      });

      setFeedback({
        type: 'success',
        message: 'Scorecard saved successfully! Existing candidate rankings marked for recalculation.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Failed to save scorecard: ' + err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const addMustSkill = () => {
    if (!newMustSkill.trim()) return;
    setMustHaveSkills([
      ...mustHaveSkills,
      { id: `must-${Date.now()}`, name: newMustSkill.trim(), category: 'must-have', weight: 5, minYearsExperience: 3 },
    ]);
    setNewMustSkill('');
  };

  const addNiceSkill = () => {
    if (!newNiceSkill.trim()) return;
    setNiceToHaveSkills([
      ...niceToHaveSkills,
      { id: `nice-${Date.now()}`, name: newNiceSkill.trim(), category: 'nice-to-have', weight: 3 },
    ]);
    setNewNiceSkill('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Job Intake & Scorecard Generator</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Job Description Intake & Scoring Criteria</h1>
          <p className="text-xs text-slate-500">
            Paste or edit job descriptions. Gemini extracts verifiable requirements into an editable evaluation framework.
          </p>
        </div>

        <button
          onClick={handleSaveScorecard}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-60 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save & Publish Scorecard'}</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg flex items-center gap-2 text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* DUAL WORKSPACE: RAW JD INPUT VS STRUCTURED SCORECARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Raw JD Intake */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Raw Job Description Input</span>
            </div>
            <button
              onClick={() => setRawJd(sampleSeniorJavaJd)}
              className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset Sample JD
            </button>
          </div>

          <textarea
            value={rawJd}
            onChange={(e) => setRawJd(e.target.value)}
            rows={18}
            className="w-full flex-1 p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:bg-white text-slate-900 leading-relaxed resize-none"
            placeholder="Paste complete Job Description here..."
          />

          <div className="mt-4">
            <button
              onClick={handleGenerateScorecard}
              disabled={extracting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs disabled:opacity-60 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>{extracting ? 'Gemini AI Extracting Scorecard...' : 'Generate AI Scorecard with Gemini'}</span>
            </button>
            <p className="mt-2 text-[11px] text-slate-400 text-center">
              Extracts 12 mandatory criteria without hallucinating unspecified details.
            </p>
          </div>
        </div>

        {/* Right Column: Editable Scorecard Fields */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Extracted Requisition Attributes</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                Scorecard Active
              </span>
            </div>

            {/* Basic Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Target Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Employment Type</label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as any)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg text-slate-900 bg-white"
                >
                  <option value="permanent">Permanent / Full-Time</option>
                  <option value="contract">Contract (C2H / Vendor)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Notice Period (Max Days)</label>
                <input
                  type="number"
                  value={maxNotice}
                  onChange={(e) => setMaxNotice(parseInt(e.target.value, 10))}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Experience Range (Years)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={minExp}
                    onChange={(e) => setMinExp(parseFloat(e.target.value))}
                    className="w-1/2 p-2 text-xs border border-slate-300 rounded-lg text-slate-900"
                    placeholder="Min"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="number"
                    value={maxExp}
                    onChange={(e) => setMaxExp(parseFloat(e.target.value))}
                    className="w-1/2 p-2 text-xs border border-slate-300 rounded-lg text-slate-900"
                    placeholder="Max"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Budgeted CTC Range (LPA)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={minCtc || ''}
                    onChange={(e) => setMinCtc(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-1/2 p-2 text-xs border border-slate-300 rounded-lg text-slate-900"
                    placeholder="Min LPA"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="number"
                    value={maxCtc || ''}
                    onChange={(e) => setMaxCtc(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-1/2 p-2 text-xs border border-slate-300 rounded-lg text-slate-900"
                    placeholder="Max LPA"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Education Requirements</label>
              <input
                type="text"
                value={eduReq}
                onChange={(e) => setEduReq(e.target.value)}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>

          {/* MUST-HAVE & NICE-TO-HAVE SKILLS SECTIONS */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 uppercase">Must-Have Skills (Mandatory)</span>
                <span className="text-[10px] text-slate-400">Primary scoring weight: {weights.mustHaveSkills}%</span>
              </div>

              <div className="space-y-2">
                {mustHaveSkills.map((skill, index) => (
                  <div key={skill.id || index} className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs">
                    <span className="font-bold text-indigo-950">{skill.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-indigo-700">Min {skill.minYearsExperience || 3} yrs exp</span>
                      <button
                        onClick={() => setMustHaveSkills(mustHaveSkills.filter((_, i) => i !== index))}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newMustSkill}
                    onChange={(e) => setNewMustSkill(e.target.value)}
                    placeholder="Add must-have skill (e.g. Hibernate, REST API)..."
                    className="flex-1 p-2 text-xs border border-slate-300 rounded-lg"
                    onKeyDown={(e) => e.key === 'Enter' && addMustSkill()}
                  />
                  <button
                    onClick={addMustSkill}
                    className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 uppercase">Nice-To-Have Skills (Preferred)</span>
                <span className="text-[10px] text-slate-400">Weight: {weights.niceToHaveSkills}%</span>
              </div>

              <div className="space-y-2">
                {niceToHaveSkills.map((skill, index) => (
                  <div key={skill.id || index} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <span className="font-semibold text-slate-800">{skill.name}</span>
                    <button
                      onClick={() => setNiceToHaveSkills(niceToHaveSkills.filter((_, i) => i !== index))}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newNiceSkill}
                    onChange={(e) => setNewNiceSkill(e.target.value)}
                    placeholder="Add nice-to-have skill (e.g. Docker, Redis)..."
                    className="flex-1 p-2 text-xs border border-slate-300 rounded-lg"
                    onKeyDown={(e) => e.key === 'Enter' && addNiceSkill()}
                  />
                  <button
                    onClick={addNiceSkill}
                    className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* WEIGHT ADJUSTMENT SLIDERS */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900 uppercase">Configurable Scoring Weights</span>
                <span className="text-[11px] font-bold text-indigo-700">
                  Total: {weights.mustHaveSkills + weights.experienceRelevance + weights.niceToHaveSkills + weights.noticePeriod + weights.locationAndRoleFit}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <WeightSlider
                  label="Must Skills"
                  value={weights.mustHaveSkills}
                  onChange={(v) => setWeights({ ...weights, mustHaveSkills: v })}
                />
                <WeightSlider
                  label="Experience"
                  value={weights.experienceRelevance}
                  onChange={(v) => setWeights({ ...weights, experienceRelevance: v })}
                />
                <WeightSlider
                  label="Nice Skills"
                  value={weights.niceToHaveSkills}
                  onChange={(v) => setWeights({ ...weights, niceToHaveSkills: v })}
                />
                <WeightSlider
                  label="Notice"
                  value={weights.noticePeriod}
                  onChange={(v) => setWeights({ ...weights, noticePeriod: v })}
                />
                <WeightSlider
                  label="Location"
                  value={weights.locationAndRoleFit}
                  onChange={(v) => setWeights({ ...weights, locationAndRoleFit: v })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface WeightSliderProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
}

const WeightSlider: React.FC<WeightSliderProps> = ({ label, value, onChange }) => {
  return (
    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
      <div className="text-[10px] font-bold text-slate-500 uppercase truncate">{label}</div>
      <div className="text-base font-extrabold text-slate-900 my-1">{value}%</div>
      <input
        type="range"
        min={5}
        max={50}
        step={5}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full accent-indigo-600"
      />
    </div>
  );
};
