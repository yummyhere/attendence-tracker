import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { MonthlyReportItem, TotalHoursItem } from '../types/index.js';
import { api } from '../services/api.js';

export const AnalyticsView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'monthly' | 'hours'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [monthlyData, setMonthlyData] = useState<MonthlyReportItem[]>([]);
  const [hoursData, setHoursData] = useState<TotalHoursItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeSubTab === 'monthly') {
      setIsLoading(true);
      api
        .getMonthlyReport(selectedMonth)
        .then((res) => setMonthlyData(res.data))
        .catch((err) => console.error('Failed to fetch monthly report:', err))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(true);
      api
        .getTotalHours(selectedDate)
        .then((res) => setHoursData(res.data))
        .catch((err) => console.error('Failed to fetch total hours:', err))
        .finally(() => setIsLoading(false));
    }
  }, [activeSubTab, selectedMonth, selectedDate]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Aggregation Pipeline Analytics (Phase 4)
          </h1>
          <div className="text-xs text-slate-500 mt-1">
            Production MongoDB aggregation pipelines running server-side calculations
          </div>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setActiveSubTab('monthly')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              activeSubTab === 'monthly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            4.2 Monthly Summary Report
          </button>
          <button
            onClick={() => setActiveSubTab('hours')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              activeSubTab === 'hours'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            4.1 Daily Total Hours Worked
          </button>
        </div>
      </div>

      {activeSubTab === 'monthly' ? (
        <div className="space-y-6">
          {/* Controls & Pipeline Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-lg shadow-xs">
            <div>
              <div className="text-xs font-semibold text-slate-900">
                Monthly Attendance Breakdown: Present vs Late vs Absent Days
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Aggregates documents grouped by employee and status into a normalized summary array
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Target Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>
          </div>

          {/* Pipeline Code Snippet */}
          <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 flex items-start gap-2">
            <div className="font-semibold shrink-0">Pipeline Stage:</div>
            <div className="font-mono text-[11px] leading-relaxed break-all">
              {`[ { $match: { date: /^${selectedMonth}/ } }, { $group: { _id: { employee_id: "$employee_id", status: "$status" }, count: { $sum: 1 } } }, { $group: { _id: "$_id.employee_id", statusCounts: { $push: { status: "$_id.status", count: "$count" } }, totalLoggedDays: { $sum: "$count" } } }, { $lookup: { from: "employees", localField: "_id", foreignField: "_id", as: "employee" } }, { $unwind: "$employee" }, { $project: { name: "$employee.name", present_days: ..., late_days: ..., absent_days: ..., total_logged_days: "$totalLoggedDays" } } ]`}
            </div>
          </div>

          {/* Monthly Report Table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Month</th>
                    <th className="py-3 px-4 text-center">Present Days</th>
                    <th className="py-3 px-4 text-center">Late Days</th>
                    <th className="py-3 px-4 text-center">Absent Days</th>
                    <th className="py-3 px-4 text-right">Total Logged Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3 px-4">
                          <div className="h-3 bg-slate-200 rounded w-28" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-3 bg-slate-100 rounded w-20" />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="h-3 bg-slate-100 rounded w-16 mx-auto" />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="h-3 bg-slate-100 rounded w-8 mx-auto" />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="h-3 bg-slate-100 rounded w-8 mx-auto" />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="h-3 bg-slate-100 rounded w-8 mx-auto" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="h-3 bg-slate-100 rounded w-10 ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : monthlyData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No monthly records found for {selectedMonth}.
                      </td>
                    </tr>
                  ) : (
                    monthlyData.map((row) => (
                      <tr key={row.employee_id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {row.name}
                          <div className="text-slate-400 text-[11px] font-normal">{row.email}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{row.department}</td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-500">
                          {row.month}
                        </td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums font-semibold text-emerald-700">
                          {row.present_days}
                        </td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums font-semibold text-amber-700">
                          {row.late_days}
                        </td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums font-semibold text-slate-500">
                          {row.absent_days}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                          {row.total_logged_days}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls & Pipeline Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-lg shadow-xs">
            <div>
              <div className="text-xs font-semibold text-slate-900">
                Daily Total Hours Worked Aggregation Pipeline
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Uses $project with $subtract (millisecond difference) converted to decimal hours
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Target Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>
          </div>

          {/* Pipeline Code Snippet */}
          <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 flex items-start gap-2">
            <div className="font-semibold shrink-0">Pipeline Stage:</div>
            <div className="font-mono text-[11px] leading-relaxed break-all">
              {`[ { $match: { date: "${selectedDate}", first_login_time: { $exists: true } } }, { $project: { total_hours: { $round: [ { $divide: [ { $subtract: [ { $ifNull: ["$last_logout_time", "$$NOW"] }, "$first_login_time" ] }, 3600000 ] }, 2 ] } } }, { $lookup: { from: "employees", localField: "employee_id", foreignField: "_id", as: "employee" } }, { $unwind: "$employee" }, { $sort: { total_hours: -1 } } ]`}
            </div>
          </div>

          {/* Total Hours Table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">First Login</th>
                    <th className="py-3 px-4">Last Logout</th>
                    <th className="py-3 px-4">Shift Status</th>
                    <th className="py-3 px-4 text-right">Computed Total Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    [...Array(4)].map((_, i) => (
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
                          <div className="h-3 bg-slate-100 rounded w-14" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="h-3 bg-slate-100 rounded w-12 ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : hoursData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No hours logged on {selectedDate}.
                      </td>
                    </tr>
                  ) : (
                    hoursData.map((row) => (
                      <tr key={row._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {row.employee?.name || 'Unknown'}
                          <div className="text-slate-400 text-[11px] font-normal">
                            {row.employee?.email}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {row.employee?.department}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                          {dayjs(row.first_login_time).format('hh:mm A')}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                          {row.last_logout_time
                            ? dayjs(row.last_logout_time).format('hh:mm A')
                            : 'Currently Active'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                              row.status === 'Present'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                          {row.total_hours.toFixed(2)} hrs
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
