import React from 'react';
import { Employee } from '../types/index.js';

export type ActiveTab = 'punch' | 'roster' | 'late' | 'history' | 'departments' | 'analytics' | 'index';

interface TopNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  employees: Employee[];
  selectedEmployeeId: string;
  onSelectEmployee: (id: string) => void;
  onReseed: () => void;
  isReseeding: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  employees,
  selectedEmployeeId,
  onSelectEmployee,
  onReseed,
  isReseeding,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-6">
            <span className="text-lg font-bold tracking-tight text-slate-900 select-none">
              OfficeTrack
            </span>

            {/* Zone 2: Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => setActiveTab('punch')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'punch'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Punch Clock
              </button>
              <button
                onClick={() => setActiveTab('roster')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'roster'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Live Roster
              </button>
              <button
                onClick={() => setActiveTab('late')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'late'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Late Arrivals
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'history'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                History Audit
              </button>
              <button
                onClick={() => setActiveTab('departments')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'departments'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Departments
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'analytics'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Analytics & Monthly
              </button>
              <button
                onClick={() => setActiveTab('index')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'index'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Index Explain
              </button>
            </nav>
          </div>

          {/* Zone 3: Primary Actions & User Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="hidden sm:inline">Active User:</span>
              <select
                value={selectedEmployeeId}
                onChange={(e) => onSelectEmployee(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900 truncate max-w-[160px] sm:max-w-[200px]"
              >
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.department})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onReseed}
              disabled={isReseeding}
              title="Reset and reseed database with 7 days of realistic records"
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors whitespace-nowrap disabled:opacity-50"
            >
              {isReseeding ? 'Seeding...' : 'Reset & Seed'}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto pb-2 pt-1 border-t border-slate-100 scrollbar-none">
          <button
            onClick={() => setActiveTab('punch')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'punch' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Punch Clock
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'roster' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Live Roster
          </button>
          <button
            onClick={() => setActiveTab('late')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'late' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Late Arrivals
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'history' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'departments' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Departments
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'analytics' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('index')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'index' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Index Explain
          </button>
        </div>
      </div>
    </header>
  );
};
