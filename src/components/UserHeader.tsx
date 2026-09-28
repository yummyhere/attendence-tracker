import React from 'react';
import { Employee } from '../types/index.js';

interface UserHeaderProps {
  currentEmployee: Employee;
  onLogout: () => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({
  currentEmployee,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Terminal Identifier */}
          <div className="flex items-center gap-3">
            <span className="text-base font-bold tracking-tight text-slate-900">
              OfficeTrack
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-medium text-slate-500">
              Attendance Terminal
            </span>
          </div>

          {/* User Account Info & Sign Out */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {currentEmployee.name}
              </div>
              <div className="text-[11px] text-slate-500">
                {currentEmployee.department}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors border border-slate-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
