import React from 'react';

export type AdminTab = 'enroll' | 'roster' | 'late' | 'history' | 'departments' | 'analytics' | 'index';

interface AdminTopNavProps {
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;
  onLogoutAdmin: () => void;
  onClearAll: () => void;
  adminEmail: string;
}

export const AdminTopNav: React.FC<AdminTopNavProps> = ({
  adminTab,
  setAdminTab,
  onLogoutAdmin,
  onClearAll,
  adminEmail,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Admin Badge */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900 select-none">
                OfficeTrack
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                ADMIN
              </span>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-1 ml-4 border-l border-slate-200 pl-4">
              <button
                onClick={() => setAdminTab('enroll')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  adminTab === 'enroll'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 bg-slate-100 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <span>+</span>
                <span>Enroll Staff</span>
              </button>
              <button
                onClick={() => setAdminTab('roster')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  adminTab === 'roster'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Live Roster
              </button>
              <button
                onClick={() => setAdminTab('late')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  adminTab === 'late'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Late Arrivals
              </button>
              <button
                onClick={() => setAdminTab('history')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  adminTab === 'history'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                History Audit
              </button>
              <button
                onClick={() => setAdminTab('departments')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  adminTab === 'departments'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Departments
              </button>
              <button
                onClick={() => setAdminTab('analytics')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  adminTab === 'analytics'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Analytics & Monthly
              </button>
              <button
                onClick={() => setAdminTab('index')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  adminTab === 'index'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Index Explain
              </button>
            </nav>
          </div>

          {/* Admin Right Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-[11px] font-bold text-white shadow-xs">
                A
              </span>
              <span className="text-xs font-semibold text-slate-800">Admin</span>
            </div>

            <button
              onClick={onClearAll}
              title="Clear all test data and start 100% fresh with real-time punches only"
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 rounded-md transition-colors whitespace-nowrap"
            >
              Clear Data
            </button>

            <button
              onClick={onLogoutAdmin}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors whitespace-nowrap"
            >
              Exit Admin / Logout
            </button>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto pb-2 pt-1 border-t border-slate-100 scrollbar-none">
          <button
            onClick={() => setAdminTab('enroll')}
            className={`px-2.5 py-1 text-xs font-semibold rounded whitespace-nowrap ${
              adminTab === 'enroll' ? 'bg-slate-900 text-white' : 'text-slate-700 bg-slate-100'
            }`}
          >
            + Enroll Staff
          </button>
          <button
            onClick={() => setAdminTab('roster')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              adminTab === 'roster' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Live Roster
          </button>
          <button
            onClick={() => setAdminTab('late')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              adminTab === 'late' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Late Arrivals
          </button>
          <button
            onClick={() => setAdminTab('history')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              adminTab === 'history' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setAdminTab('departments')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              adminTab === 'departments' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Departments
          </button>
          <button
            onClick={() => setAdminTab('analytics')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              adminTab === 'analytics' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setAdminTab('index')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              adminTab === 'index' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Index Explain
          </button>
        </div>
      </div>
    </header>
  );
};
