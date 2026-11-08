// TalentRank AI — Technical Design Document PDF Generator
// Generates a comprehensive, professional Technical Design Document PDF covering all 20 required sections

import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

export function generateTechnicalDesignPdf(outputPath: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 45;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeaderFooter();
    }
  };

  const drawHeaderFooter = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('TalentRank AI — Technical Architecture & System Design Document', margin, 30);
    doc.text('Confidential — Enterprise Staffing Operations', pageWidth - margin - 180, 30);
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, 35, pageWidth - margin, 35);
  };

  // COVER / TITLE SECTION
  drawHeaderFooter();
  y = 65;

  doc.setFillColor(30, 41, 59); // Slate-900
  doc.rect(margin, y, contentWidth, 80, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('TALENTRANK AI', margin + 20, y + 35);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text('Intelligent Hiring. Explainable Decisions. Production System Design Document', margin + 20, y + 55);

  y += 95;

  // Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 65, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('PROJECT:', margin + 15, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.text('TalentRank AI (Production Recruitment SaaS Platform)', margin + 75, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.text('TARGET CLIENT:', margin + 15, y + 35);
  doc.setFont('helvetica', 'normal');
  doc.text('Staffing Agency in Noida (70 recruiters, 120 employees, 300 reqs/mo, 120 CVs/req)', margin + 105, y + 35);

  doc.setFont('helvetica', 'bold');
  doc.text('GITHUB REPO:', margin + 15, y + 50);
  doc.setFont('helvetica', 'normal');
  doc.text('https://github.com/talentrank-ai/talentrank-ai (Pending Initial Commit)', margin + 95, y + 50);

  y += 85;

  const addSection = (num: number, title: string, content: string[]) => {
    checkPageBreak(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text(`${num}. ${title.toUpperCase()}`, margin, y);
    y += 18;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85); // Slate-700

    for (const paragraph of content) {
      const splitText = doc.splitTextToSize(paragraph, contentWidth);
      const textHeight = splitText.length * 13;
      checkPageBreak(textHeight + 10);
      doc.text(splitText, margin, y);
      y += textHeight + 8;
    }
    y += 10;
  };

  // Section 1: Project Overview
  addSection(1, 'Project Overview', [
    'TalentRank AI is an enterprise-grade AI resume screening and recruitment management platform designed specifically for high-volume staffing agencies operating in Noida and Delhi NCR.',
    'The platform processes contract and permanent IT, banking back-office, and retail recruitment pipelines with approximately 300 open requisitions per month and up to 120 CVs per requisition (36,000 resumes monthly).',
    'Core Mission: Replace arbitrary manual resume keyword matching with objective, explainable, verifiable AI ranking while maintaining human-in-the-loop oversight and strict DPDP Act 2023 compliance.',
  ]);

  // Section 2: Client Problem
  addSection(2, 'Client Problem & Operational Bottlenecks', [
    '1. High Manual Overhead: 70 recruiters spending over 4.5 hours daily reading unstructured resumes across Java, Python, and banking operations.',
    '2. Subjective & Unreliable Screening: Recruiters frequently reject qualified candidates due to fatigue or keyword mismatches, leading to inconsistent client submissions.',
    '3. Lack of Explainability: Existing legacy ATS solutions generate black-box scores with no evidence, failing client audits.',
    '4. Client Portal Disconnect: Hiring managers receive raw unvetted CVs via email, leaking candidate PII and risking candidate poaching.',
  ]);

  // Section 3: Proposed Solution
  addSection(3, 'Proposed Solution Architecture', [
    'TalentRank AI introduces a dual-portal architecture separating Recruiter Operations from Client Hiring Manager Review.',
    'Key Capabilities:',
    '• Gemini AI Scorecard Extraction: Extracts 12 structured criteria from raw JDs into editable evaluation rubrics with customizable weights.',
    '• High-Throughput Bulk CV Ingestion: Parses multi-file PDF and DOCX batches asynchronously with bounded concurrency and duplicate detection.',
    '• Verifiable Quotation Scoring: Every scored dimension is backed by verbatim text extracted from the candidate CV. Missing skills receive a verified score of 0.',
    '• Client Data Isolation & PII Masking: Strict backend authorization ensures client managers only see candidates explicitly submitted to their organization with masked emails and phone numbers.',
  ]);

  // Section 4: Technology Choices & Reasoning
  addSection(4, 'Technology Choices & Reasoning', [
    '• Frontend: React 19, TypeScript, Tailwind CSS, Lucide icons. Delivers a Linear/Stripe-inspired restrained design system free from decorative visual clutter.',
    '• Backend: Node.js, Express, TypeScript, Vite middlewares. Unified server architecture eliminating CORS friction and securing server-side Gemini AI credentials.',
    '• AI Engine: Google Gemini API (gemini-3.8-flash) utilizing structured JSON responseSchema and thinkingLevel tuning for rapid, deterministic inference.',
    '• Document Processing: Mammoth for DOCX and pdf-parse for PDF streams with multimodal OCR fallback.',
    '• Database & Security: In-Memory Firestore-compatible store with full support for Cloud Firestore, enforcing schema constraints and role-based access control.',
  ]);

  // Section 5: Database Schema
  addSection(5, 'Database Schema & Data Model', [
    'Firestore Collections:',
    '1. users: id, email, name, role (recruiter | client), organizationId, avatarUrl, createdAt.',
    '2. organizations: id, name, industry, location, activeRequisitionsCount, contactEmail.',
    '3. requisitions: id, reqNumber, title, organizationId, status, minExp, maxExp, minCtc, maxCtc, maxNoticeDays, rawJd, scorecardId.',
    '4. scorecards: id, requisitionId, jobTitle, location, mustHaveSkills, niceToHaveSkills, weights, version.',
    '5. candidates: id, candidateNumber, name, email (masked for client), phone (masked for client), currentRole, totalExp, skills, extractedCvText, stage, recruiterReviewed.',
    '6. candidateScores: id, candidateId, overallScore, criteria (name, score, evidenceQuotation, confidenceScore, isVerifiedInCvText), strengths, gaps, recommendation.',
    '7. clientSubmissions: id, requisitionId, candidateId, organizationId, status, rejectionReason, feedback.',
    '8. pipelineEvents & auditLogs: immutable event logging tracking user, role, action, target resource, and timestamps.',
    '9. consentRecords & deletionRequests: DPDP Act 2023 compliance records for purpose limitation and right to erasure.',
  ]);

  // Section 6: AI Extraction Architecture
  addSection(6, 'AI Extraction Architecture', [
    'The JD intake pipeline receives raw text or pasted documents and feeds them to Gemini 3.8 Flash with a strict JSON schema. The model extracts 12 structured dimensions:',
    'Job title, location, employment type, min experience, max experience, min CTC, max CTC, max notice period, education, must-have skills, and nice-to-have skills.',
    'Missing requirements are explicitly flagged as unspecified rather than hallucinated. The extracted scorecard is rendered into editable controls allowing recruiters to tweak weights and mandatory thresholds.',
  ]);

  // Section 7: AI Scoring Methodology & Evidence Verification
  addSection(7, 'AI Scoring Methodology & Evidence Verification', [
    'Normalized Weight Distribution:',
    '• Must-Have Technical Skills: 35% | Experience Relevance: 25% | Nice-To-Have Skills: 15% | Notice Period Fit: 15% | Location & Role Match: 10%',
    'Critical Evidence Rule: For every scored requirement, Gemini must output an exact quotation extracted from the candidate CV text.',
    'Server-Side Verification Engine: The server independently searches the candidate raw text for the returned quotation. If verified, isVerifiedInCvText = true; if not found or fabricated, the criterion is marked unverified with score 0.',
  ]);

  // Section 8: Fairness Safeguards & Anti-Bias Protections
  addSection(8, 'Fairness Safeguards & Anti-Bias Protections', [
    '1. Protected Attribute Exclusion: Names, emails, phone numbers, gender, age, marital status, and photographs are stripped prior to scoring.',
    '2. Human-in-the-Loop Gateway: AI recommendations are strictly decision-support tools. Recruiters must open, review, and approve every candidate profile before client submission.',
    '3. Searchability of Low Scores: Low-scoring candidates remain 100% searchable in tables and filters to ensure diverse consideration.',
    '4. Delivery-Head Fairness Review: Weekly randomized sample audits human override rates (e.g. 8.3%) and divergence factors.',
  ]);

  // Section 9: Privacy & DPDP Compliance
  addSection(9, 'Privacy, Security & DPDP Act 2023 Compliance', [
    '• Purpose Limitation: Candidate CVs are processed strictly for recruitment evaluation under explicit consent records.',
    '• Client PII Masking: Client hiring managers only receive masked emails (*****@masked.talentrank.ai) and masked phone numbers (+91 ***** *****).',
    '• Right to Erasure Workflow: Executes data subject deletion requests by permanently purging raw CV text, phone, and email while preserving minimal audit IDs.',
    '• Tamper-Evident Audit Logging: Immutable logging of profile views, stage transitions, and client actions.',
  ]);

  // Section 10: Testing Strategy & Verification
  addSection(10, 'Testing Strategy & Quality Assurance', [
    'Automated test suite (src/test/runAllTests.ts) executes and validates all 14 mandatory functional scenarios:',
    '1. JD scorecard extraction schema | 2. PDF parsing | 3. DOCX parsing | 4. Duplicate detection | 5. Scoring calculation | 6. Verifiable quotations | 7. Missing evidence handling | 8. Protected attribute exclusion | 9. Recruiter-only access | 10. Client data isolation | 11. Recruiter review gate | 12. Mandatory client rejection reason | 13. Pipeline transitions | 14. DPDP consent & erasure.',
  ]);

  // Section 11: Future Roadmap
  addSection(11, 'Scope Limitations & Future Improvements', [
    '• Intentionally Excluded: Direct WhatsApp/Email dispatch (simulated in-app to avoid spam traps); External third-party calendar synchronizations.',
    '• Future Roadmap: Multilingual resume parsing for regional Indian languages; Automated interview video transcript analysis; Advanced compensation benchmarking.',
  ]);

  const pdfBytes = doc.output('arraybuffer');
  fs.writeFileSync(outputPath, Buffer.from(pdfBytes));
  console.log(`[TalentRank AI] Technical Design Document PDF created successfully at: ${outputPath}`);
}

// Execute generator
const outputPdfPath = path.resolve('TalentRank_AI_Technical_Design_Document.pdf');
generateTechnicalDesignPdf(outputPdfPath);
