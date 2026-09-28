import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { api } from '../services/api.js';

export const DepartmentFilterView: React.FC = () => {
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api.getDepartments().then((res) => {
      setDepartments(res.data);
      if (res.data.length > 0) {
        setSelectedDepts(res.data);
      }
    });
  }, []);

  const fetchFiltered = async () => {
    if (selectedDepts.length === 0) {
      setRecords([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.filterDepartments(selectedDepts, selectedDate);
      setRecords(res.data);
    } catch (err) {
      console.error('Failed to filter by departments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltered();
  }, [selectedDepts, selectedDate]);

  const toggleDept = (dept: string) => {
    setSelectedDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Multi-Department Attendance Query (Phase 3.3)
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span>Aggregation pipeline with $lookup to employees + $in on department</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{records.length} Employees Matched</span>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-800"
          />
        </div>
      </div>

      {/* Department Selector Checkboxes */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Select Target Departments ($in clause):
        </div>
        <div className="flex flex-wrap gap-2">
          {departments.map((dept) => {
            const isSelected = selectedDepts.includes(dept);
            return (
              <button
                key={dept}
                onClick={() => toggleDept(dept)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isSelected ? '✓ ' : '+ '}
                {dept}
              </button>
            );
          })}
        </div>
      </div>

      {/* Query Explanation Banner */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 text-xs text-slate-800 flex items-start gap-3">
        <div className="font-semibold shrink-0">MongoDB Pipeline:</div>
        <div className="font-mono text-[11px] leading-relaxed break-all">
          {`Attendance.aggregate([ { $match: { date: "${selectedDate}" } }, { $lookup: { from: "employees", localField: "employee_id", foreignField: "_id", as: "employee" } }, { $unwind: "$employee" }, { $match: { "employee.department": { $in: [${selectedDepts.map((d) => `"${d}"`).join(', ')}] } } } ])`}
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Shift Start</th>
                <th className="py-3 px-4">First Login</th>
                <th className="py-3 px-4">Last Logout</th>
                <th className="py-3 px-4">Daily Status</th>
                <th className="py-3 px-4 text-right">Logs Count</th>
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
                    <td className="py-3 px-4">
                      <div className="h-3 bg-slate-100 rounded w-14" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="h-3 bg-slate-100 rounded w-8 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No attendance records found for selected departments on {selectedDate}.
                  </td>
                </tr>
              ) : (
                records.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.employee.name}
                      <div className="text-slate-400 text-[11px] font-normal">{item.employee.email}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{item.employee.department}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 tabular-nums">
                      {item.employee.shift_start}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                      {item.first_login_time ? dayjs(item.first_login_time).format('hh:mm A') : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                      {item.last_logout_time ? dayjs(item.last_logout_time).format('hh:mm A') : '—'}
                    </td>
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
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                      {item.activity_logs?.length || 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
