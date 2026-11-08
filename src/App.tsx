import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout, ScreenType } from './components/AppLayout';
import { LoginScreen } from './components/LoginScreen';
import { RecruiterDashboard } from './components/RecruiterDashboard';
import { AiJobScorecardScreen } from './components/AiJobScorecardScreen';
import { BulkCvUploadScreen } from './components/BulkCvUploadScreen';
import { CandidateRankingScreen } from './components/CandidateRankingScreen';
import { RecruitmentPipelineScreen } from './components/RecruitmentPipelineScreen';
import { ClientPortalScreen } from './components/ClientPortalScreen';
import { PrivacyAndAuditScreen } from './components/PrivacyAndAuditScreen';
import { FairnessReviewScreen } from './components/FairnessReviewScreen';

const MainAppContent: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Initializing TalentRank AI Platform...</span>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Login Screen
  if (!currentUser) {
    return <LoginScreen onSuccess={() => setCurrentScreen('dashboard')} />;
  }

  // Client role defaults to client portal if they try to access recruiter operations
  const effectiveScreen = currentUser.role === 'client' && currentScreen !== 'pipeline' ? 'client_portal' : currentScreen;

  return (
    <AppLayout currentScreen={effectiveScreen} onNavigate={setCurrentScreen}>
      {effectiveScreen === 'dashboard' && <RecruiterDashboard onNavigate={setCurrentScreen} />}
      {effectiveScreen === 'scorecard' && <AiJobScorecardScreen />}
      {effectiveScreen === 'bulk_upload' && <BulkCvUploadScreen onNavigate={setCurrentScreen} />}
      {effectiveScreen === 'candidates' && <CandidateRankingScreen />}
      {effectiveScreen === 'pipeline' && <RecruitmentPipelineScreen />}
      {effectiveScreen === 'client_portal' && <ClientPortalScreen />}
      {effectiveScreen === 'privacy_audit' && <PrivacyAndAuditScreen />}
      {effectiveScreen === 'fairness_review' && <FairnessReviewScreen />}
    </AppLayout>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
