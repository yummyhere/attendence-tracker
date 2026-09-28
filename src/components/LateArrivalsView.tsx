import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { LateEmployeeItem } from '../types/index.js';
import { api } from '../services/api.js';

interface LateArrivalsViewProps {
  onSelectEmployeeForHistory: (employeeId: string) => void;
}

export const LateArrivalsView: React.FC<LateArrivalsViewProps> = ({
  onSelectEmployeeForHistory,
}) => {
  const [lateEmployees, setLateEmployees] = useState<LateEmployeeItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchLateData = async (date: string) => {
    setIsLoading(true);
    try {
      const res = await api.getLateEmployees(date);
      setLateEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch late employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLateData(selectedDate);
  }, [selectedDate]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Late Arrivals Audit (Phase 3.1)
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span>Grace Threshold: 15 minutes past scheduled shift start (09:15 AM baseline)</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{lateEmployees.length} Delayed Arrivals</span>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Audit Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-800"
          />
        </div>
      </div>

      {/* Query Explanation Banner */}
      <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-4 text-xs text-amber-900 flex items-start gap-3">
        <div className="font-semibold shrink-0">MongoDB Filter:</div>
        <div className="font-mono text-[11px] leading-relaxed break-all">
          {`Attendance.find({ date: "${selectedDate}", status: "Late" }).populate("employee_id").sort({ first_login_time: 1 })`}
        </div>
      </div>

      {/* Late Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Shift Start</th>
                <th className="py-3 px-4">Grace Deadline</th>
                <th className="py-3 px-4">First Login Recorded</th>
                <th className="py-3 px-4 text-right">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4">
                      <div className="h-3 bg-slate-200 rounded w-28" />
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
                    <td className="py-3 px-4 text-right">
                      <div className="h-3 bg-slate-100 rounded w-12 ml-auto" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="h-3 bg-slate-100 rounded w-12 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : lateEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No late arrivals logged for {selectedDate}. All present staff arrived within the grace period.
                  </td>
                </tr>
              ) : (
                lateEmployees.map((record) => {
                  return (
                    <tr key={record._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {record.name}
                        <div className="text-slate-400 text-[11px] font-normal">{record.email}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{record.department}</td>
                      <td className="py-3 px-4 font-mono text-slate-500 tabular-nums">
                        {record.shift_start}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 tabular-nums">
                        09:15 AM
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums font-semibold text-amber-800">
                        {record.formatted_login}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          Late
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSelectEmployeeForHistory(record.employee_id)}
                          className="text-xs text-slate-700 hover:text-slate-900 hover:underline font-medium"
                        >
                          View History
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
