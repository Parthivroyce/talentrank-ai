import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileCheck2,
  UploadCloud,
  Users2,
  KanbanSquare,
  Shield,
  Scale,
  LogOut,
  Building2,
  UserCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export type ScreenType =
  | 'dashboard'
  | 'scorecard'
  | 'bulk_upload'
  | 'candidates'
  | 'pipeline'
  | 'client_portal'
  | 'privacy_audit'
  | 'fairness_review';

interface AppLayoutProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ currentScreen, onNavigate, children }) => {
  const { currentUser, logout, switchRole } = useAuth();

  const isRecruiter = currentUser?.role === 'recruiter';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans antialiased">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        {/* Brand header */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900">TalentRank</span>
              <span className="text-indigo-600 font-bold text-sm ml-1">AI</span>
            </div>
          </div>
          <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            v2.6
          </span>
        </div>

        {/* User Role Badge & Switcher */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Active Session
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isRecruiter ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isRecruiter ? 'Recruiter' : 'Client Portal'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <img
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={currentUser?.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-900 truncate">{currentUser?.name}</div>
              <div className="text-[11px] text-slate-500 truncate">
                {isRecruiter ? 'Noida Staffing Hub' : currentUser?.organizationName || 'Client Org'}
              </div>
            </div>
          </div>

          {/* Quick Role Switcher Button for Testing convenience */}
          <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-medium">Switch Evaluator:</span>
            <button
              onClick={() => switchRole(isRecruiter ? 'client' : 'recruiter')}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
            >
              {isRecruiter ? 'To Client View' : 'To Recruiter View'}
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {isRecruiter ? (
            <>
              <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Staffing Operations
              </div>

              <NavItem
                icon={<LayoutDashboard className="w-4 h-4" />}
                label="Recruiter Dashboard"
                active={currentScreen === 'dashboard'}
                onClick={() => onNavigate('dashboard')}
              />
              <NavItem
                icon={<FileCheck2 className="w-4 h-4" />}
                label="AI JD Scorecards"
                badge="Gemini"
                active={currentScreen === 'scorecard'}
                onClick={() => onNavigate('scorecard')}
              />
              <NavItem
                icon={<UploadCloud className="w-4 h-4" />}
                label="Bulk CV Upload"
                active={currentScreen === 'bulk_upload'}
                onClick={() => onNavigate('bulk_upload')}
              />
              <NavItem
                icon={<Users2 className="w-4 h-4" />}
                label="AI Candidate Ranking"
                badge="Evidence"
                active={currentScreen === 'candidates'}
                onClick={() => onNavigate('candidates')}
              />
              <NavItem
                icon={<KanbanSquare className="w-4 h-4" />}
                label="Recruitment Pipeline"
                active={currentScreen === 'pipeline'}
                onClick={() => onNavigate('pipeline')}
              />

              <div className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Enterprise & Governance
              </div>

              <NavItem
                icon={<Building2 className="w-4 h-4 text-emerald-600" />}
                label="Client Portal Preview"
                active={currentScreen === 'client_portal'}
                onClick={() => onNavigate('client_portal')}
              />
              <NavItem
                icon={<Scale className="w-4 h-4" />}
                label="Fairness & Delivery Review"
                active={currentScreen === 'fairness_review'}
                onClick={() => onNavigate('fairness_review')}
              />
              <NavItem
                icon={<Shield className="w-4 h-4" />}
                label="DPDP Privacy & Audit"
                active={currentScreen === 'privacy_audit'}
                onClick={() => onNavigate('privacy_audit')}
              />
            </>
          ) : (
            <>
              <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Client Organization
              </div>

              <NavItem
                icon={<Building2 className="w-4 h-4" />}
                label="Candidate Review Portal"
                badge="Active"
                active={currentScreen === 'client_portal'}
                onClick={() => onNavigate('client_portal')}
              />
              <NavItem
                icon={<KanbanSquare className="w-4 h-4" />}
                label="Our Requisitions"
                active={currentScreen === 'pipeline'}
                onClick={() => onNavigate('pipeline')}
              />
            </>
          )}
        </nav>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-medium">
            <div>DPDP Act 2023</div>
            <div className="text-slate-400">Strict PII Masking Active</div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-900 capitalize">
              {currentScreen.replace('_', ' ')}
            </h2>
            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300" />
            <span className="hidden sm:inline-block text-xs text-slate-500">
              Noida Staffing Unit • Senior Java Requisition [REQ-2026-081]
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Gemini AI 3.8 Flash Connected</span>
            </div>

            <button
              onClick={() => onNavigate('scorecard')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              + Create Requisition
            </button>
          </div>
        </header>

        {/* Screen View Container */}
        <div className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</div>
      </main>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  active?: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, badge, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
        active
          ? 'bg-indigo-50/80 text-indigo-700 font-bold'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className={active ? 'text-indigo-600' : 'text-slate-400'}>{icon}</span>
        <span>{label}</span>
      </div>
      {badge && (
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            active ? 'bg-indigo-200/60 text-indigo-800' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
};
