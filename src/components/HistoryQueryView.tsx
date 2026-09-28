import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Employee, AttendanceRecord } from '../types/index.js';
import { api } from '../services/api.js';

interface HistoryQueryViewProps {
  employees: Employee[];
  selectedEmployeeId: string;
  onSelectEmployee: (id: string) => void;
}

export const HistoryQueryView: React.FC<HistoryQueryViewProps> = ({
  employees,
  selectedEmployeeId,
  onSelectEmployee,
}) => {
  const [startDate, setStartDate] = useState(dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentEmployee = employees.find((e) => e._id === selectedEmployeeId) || employees[0];

  const fetchHistory = async () => {
    if (!selectedEmployeeId) return;
    setIsLoading(true);
    try {
      const res = await api.getEmployeeHistory(selectedEmployeeId, startDate, endDate);
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch employee history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedEmployeeId, startDate, endDate]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Attendance History Audit (Phase 3.2)
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span>Query: $and + $eq on employee_id and date range filter</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{history.length} Day Records Found</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Employee Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Employee:</span>
            <select
              value={selectedEmployeeId}
              onChange={(e) => onSelectEmployee(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-800"
            >
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.department})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Query Explanation Banner */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 text-xs text-slate-800 flex items-start gap-3">
        <div className="font-semibold shrink-0">Executed Query:</div>
        <div className="font-mono text-[11px] leading-relaxed break-all">
          {`Attendance.find({ $and: [ { employee_id: { $eq: ObjectId("${selectedEmployeeId}") } }, { date: { $gte: "${startDate}", $lte: "${endDate}" } } ] }).sort({ date: -1 })`}
        </div>
      </div>

      {/* History Records Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">First Login</th>
                <th className="py-3 px-4">Last Logout</th>
                <th className="py-3 px-4">Activity Log Sequence</th>
                <th className="py-3 px-4 text-right">Computed Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4">
                      <div className="h-3 bg-slate-200 rounded w-20" />
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
                      <div className="h-3 bg-slate-100 rounded w-48" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="h-3 bg-slate-100 rounded w-12 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No attendance records found for {currentEmployee?.name} in the selected date range.
                  </td>
                </tr>
              ) : (
                history.map((record) => {
                  let hoursWorked = 0;
                  if (record.first_login_time && record.last_logout_time) {
                    const diffMs = Math.max(
                      0,
                      new Date(record.last_logout_time).getTime() - new Date(record.first_login_time).getTime()
                    );
                    hoursWorked = Number((diffMs / 3600000).toFixed(2));
                  } else if (record.first_login_time && record.date === dayjs().format('YYYY-MM-DD')) {
                    const diffMs = Math.max(
                      0,
                      Date.now() - new Date(record.first_login_time).getTime()
                    );
                    hoursWorked = Number((diffMs / 3600000).toFixed(2));
                  }

                  return (
                    <tr key={record._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900 tabular-nums">
                        {record.date}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                            record.status === 'Present'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : record.status === 'Late'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                        {record.first_login_time
                          ? dayjs(record.first_login_time).format('hh:mm A')
                          : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                        {record.last_logout_time
                          ? dayjs(record.last_logout_time).format('hh:mm A')
                          : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {record.activity_logs && record.activity_logs.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {record.activity_logs.map((log, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {log.action}: {dayjs(log.time).format('HH:mm')}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No activity logs</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {hoursWorked.toFixed(2)} hrs
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
