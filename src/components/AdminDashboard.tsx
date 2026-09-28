import React, { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { RosterItem } from '../types/index.js';
import { api } from '../services/api.js';

interface AdminDashboardProps {
  onSelectEmployeeForHistory: (employeeId: string) => void;
  onSelectEmployeeForPunch: (employeeId: string) => void;
  lastUpdatedTrigger?: number;
}

type SortField = 'name' | 'department' | 'first_login' | 'hours' | 'status';
type SortDirection = 'asc' | 'desc';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onSelectEmployeeForHistory,
  onSelectEmployeeForPunch,
  lastUpdatedTrigger,
}) => {
  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Present' | 'Late' | 'Absent' | 'ClockedIn'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [autoRefreshSeconds, setAutoRefreshSeconds] = useState(12);
  const [now, setNow] = useState(dayjs());

  // Keep a client tick every second for real-time hours calculations
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(dayjs());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchRosterData = async () => {
    try {
      const res = await api.getRoster();
      setRoster(res.data);
    } catch (err) {
      console.error('Failed to fetch roster:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and on trigger change
  useEffect(() => {
    fetchRosterData();
  }, [lastUpdatedTrigger]);

  // Polling mechanism every 12 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoRefreshSeconds((prev) => {
        if (prev <= 1) {
          fetchRosterData();
          return 12;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Compute live hours worked for each row
  const computedRoster = useMemo(() => {
    return roster.map((item) => {
      if (!item.first_login_time) {
        return { ...item, liveHours: 0 };
      }
      const firstLogin = dayjs(item.first_login_time);
      const isCurrentlyIn = item.currentClockState === 'In';
      const endTime = isCurrentlyIn
        ? now
        : item.last_logout_time
        ? dayjs(item.last_logout_time)
        : firstLogin;

      const diffMs = Math.max(0, endTime.diff(firstLogin));
      const liveHours = Number((diffMs / 3600000).toFixed(2));
      return { ...item, liveHours };
    });
  }, [roster, now]);

  // Distinct departments for filter
  const departments = useMemo(() => {
    const depts = new Set<string>();
    roster.forEach((r) => {
      if (r.employee?.department) depts.add(r.employee.department);
    });
    return Array.from(depts).sort();
  }, [roster]);

  // Filtered & sorted roster
  const filteredRoster = useMemo(() => {
    return computedRoster
      .filter((item) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.employee.name.toLowerCase().includes(q);
          const matchEmail = item.employee.email.toLowerCase().includes(q);
          if (!matchName && !matchEmail) return false;
        }

        // Department filter
        if (selectedDept !== 'all' && item.employee.department !== selectedDept) {
          return false;
        }

        // Status filter
        if (statusFilter === 'ClockedIn' && item.currentClockState !== 'In') {
          return false;
        }
        if (statusFilter !== 'all' && statusFilter !== 'ClockedIn') {
          if (item.status !== statusFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        if (sortField === 'name') {
          valA = a.employee.name.toLowerCase();
          valB = b.employee.name.toLowerCase();
        } else if (sortField === 'department') {
          valA = a.employee.department.toLowerCase();
          valB = b.employee.department.toLowerCase();
        } else if (sortField === 'first_login') {
          valA = a.first_login_time ? new Date(a.first_login_time).getTime() : 0;
          valB = b.first_login_time ? new Date(b.first_login_time).getTime() : 0;
        } else if (sortField === 'hours') {
          valA = a.liveHours;
          valB = b.liveHours;
        } else if (sortField === 'status') {
          valA = a.status;
          valB = b.status;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [computedRoster, searchQuery, selectedDept, statusFilter, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Quick stats summary
  const summaryStats = useMemo(() => {
    const total = roster.length;
    const clockedIn = roster.filter((r) => r.currentClockState === 'In').length;
    const late = roster.filter((r) => r.status === 'Late').length;
    const present = roster.filter((r) => r.status === 'Present').length;
    const absent = roster.filter((r) => r.status === 'Absent').length;
    return { total, clockedIn, late, present, absent };
  }, [roster]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header & Live Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Live Office Attendance Roster
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span>Date: {dayjs().format('YYYY-MM-DD')}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{summaryStats.total} Total Staff</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-medium font-mono tabular-nums">
              {summaryStats.clockedIn} Clocked In Now
            </span>
          </div>
        </div>

        {/* Polling controller */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live polling:</span>
            <span className="font-mono tabular-nums font-semibold text-slate-700">
              {autoRefreshSeconds}s
            </span>
          </div>
          <button
            onClick={() => {
              setAutoRefreshSeconds(12);
              fetchRosterData();
            }}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-lg shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search employee name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-3 pr-8 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0">Dept:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-800"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter Tabs (Functional segmented control) */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md border border-slate-200 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded transition-colors ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({roster.length})
          </button>
          <button
            onClick={() => setStatusFilter('ClockedIn')}
            className={`px-2.5 py-1 rounded transition-colors ${
              statusFilter === 'ClockedIn'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            In ({summaryStats.clockedIn})
          </button>
          <button
            onClick={() => setStatusFilter('Late')}
            className={`px-2.5 py-1 rounded transition-colors ${
              statusFilter === 'Late'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Late ({summaryStats.late})
          </button>
          <button
            onClick={() => setStatusFilter('Absent')}
            className={`px-2.5 py-1 rounded transition-colors ${
              statusFilter === 'Absent'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Absent ({summaryStats.absent})
          </button>
        </div>
      </div>

      {/* Main Roster Data Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th
                  onClick={() => toggleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Employee</span>
                    <span className="text-slate-400 font-mono">{getSortIcon('name')}</span>
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('department')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Department</span>
                    <span className="text-slate-400 font-mono">{getSortIcon('department')}</span>
                  </div>
                </th>
                <th className="py-3 px-4 select-none">Shift Start</th>
                <th
                  onClick={() => toggleSort('first_login')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>First Login</span>
                    <span className="text-slate-400 font-mono">{getSortIcon('first_login')}</span>
                  </div>
                </th>
                <th className="py-3 px-4 select-none">Last Event</th>
                <th
                  onClick={() => toggleSort('status')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Daily Status</span>
                    <span className="text-slate-400 font-mono">{getSortIcon('status')}</span>
                  </div>
                </th>
                <th className="py-3 px-4 select-none">Live State</th>
                <th
                  onClick={() => toggleSort('hours')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 select-none text-right transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Hours Worked</span>
                    <span className="text-slate-400 font-mono">{getSortIcon('hours')}</span>
                  </div>
                </th>
                <th className="py-3 px-4 text-right select-none">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                // Clean Skeleton Loading State
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4">
                      <div className="h-3.5 bg-slate-200 rounded w-28 mb-1" />
                      <div className="h-2.5 bg-slate-100 rounded w-36" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-3 bg-slate-100 rounded w-20" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-3 bg-slate-100 rounded w-16" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-3 bg-slate-100 rounded w-16" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-3 bg-slate-100 rounded w-16" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-3 bg-slate-100 rounded w-14" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-3 bg-slate-100 rounded w-14" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="h-3 bg-slate-100 rounded w-12 ml-auto" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="h-3 bg-slate-100 rounded w-16 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredRoster.length === 0 ? (
                // Sensible Empty State
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="text-slate-400 text-sm">No employees match your filter criteria.</div>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedDept('all');
                        setStatusFilter('all');
                      }}
                      className="mt-3 text-xs text-slate-700 underline font-medium hover:text-slate-900"
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredRoster.map((item) => {
                  const isClockedIn = item.currentClockState === 'In';
                  return (
                    <tr
                      key={item.employee._id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {/* Employee Name & Email */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.employee.name}</div>
                        <div className="text-slate-400 text-[11px] truncate max-w-[200px]">
                          {item.employee.email}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 text-slate-600">{item.employee.department}</td>

                      {/* Shift Start */}
                      <td className="py-3 px-4 font-mono text-slate-500 tabular-nums">
                        {item.employee.shift_start}
                      </td>

                      {/* First Login Time */}
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                        {item.first_login_time
                          ? dayjs(item.first_login_time).format('hh:mm A')
                          : '—'}
                      </td>

                      {/* Last Event */}
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-500">
                        {item.last_logout_time
                          ? dayjs(item.last_logout_time).format('hh:mm A')
                          : item.first_login_time
                          ? 'Active'
                          : '—'}
                      </td>

                      {/* Daily Status (Present / Late / Absent) - Muted, accessible */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                            item.status === 'Present'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : item.status === 'Late'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Live State (Clocked In vs Clocked Out) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              isClockedIn ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                          <span className="text-slate-700 font-medium">
                            {isClockedIn ? 'Clocked In' : item.attendance ? 'Logged Out' : 'Absent'}
                          </span>
                        </div>
                      </td>

                      {/* Hours Worked (Live calculated) */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {item.liveHours.toFixed(2)} hrs
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => onSelectEmployeeForPunch(item.employee._id)}
                          className="text-xs text-slate-600 hover:text-slate-900 hover:underline font-medium"
                        >
                          Punch
                        </button>
                        <span className="text-slate-300">·</span>
                        <button
                          onClick={() => onSelectEmployeeForHistory(item.employee._id)}
                          className="text-xs text-slate-600 hover:text-slate-900 hover:underline font-medium"
                        >
                          History
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
