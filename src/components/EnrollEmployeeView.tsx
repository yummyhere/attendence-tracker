import React, { useState } from 'react';
import { Employee } from '../types/index.js';
import { api } from '../services/api.js';

interface EnrollEmployeeViewProps {
  employees: Employee[];
  onEmployeeCreated: () => void;
  onSelectEmployeeForPunch: (id: string) => void;
  onClearAllData: () => void;
}

export const EnrollEmployeeView: React.FC<EnrollEmployeeViewProps> = ({
  employees,
  onEmployeeCreated,
  onSelectEmployeeForPunch,
  onClearAllData,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [department, setDepartment] = useState('Engineering');
  const [customDept, setCustomDept] = useState('');
  const [shiftStart, setShiftStart] = useState('09:00 AM');
  const [customShift, setCustomShift] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resettingEmp, setResettingEmp] = useState<{ id: string; name: string } | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const predefinedDepartments = [
    'Engineering',
    'Product',
    'Design',
    'Operations',
    'Marketing',
    'Human Resources',
    'Sales',
    'Customer Support',
    'Custom...',
  ];

  const predefinedShifts = [
    '08:30 AM',
    '09:00 AM',
    '09:30 AM',
    '10:00 AM',
    'Custom...',
  ];

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setMessage({ type: 'error', text: 'Name and Email are required.' });
      return;
    }

    const finalDepartment = department === 'Custom...' ? customDept.trim() : department;
    if (!finalDepartment) {
      setMessage({ type: 'error', text: 'Please specify a department.' });
      return;
    }

    const finalShift = shiftStart === 'Custom...' ? customShift.trim() : shiftStart;
    if (!finalShift) {
      setMessage({ type: 'error', text: 'Please specify shift start time.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await api.createEmployee({
        name: name.trim(),
        email: email.trim(),
        password: password.trim() || '123456',
        department: finalDepartment,
        shift_start: finalShift,
      });

      setMessage({
        type: 'success',
        text: `Employee "${res.data.name}" enrolled successfully! They can log in with password "${password.trim() || '123456'}".`,
      });
      setName('');
      setEmail('');
      setPassword('123456');
      setCustomDept('');
      setCustomShift('');
      onEmployeeCreated();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to enroll employee.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingEmp || !newPasswordInput.trim()) return;

    setIsResetting(true);
    try {
      await api.updateEmployeePassword(resettingEmp.id, newPasswordInput.trim());
      setMessage({
        type: 'success',
        text: `Password for ${resettingEmp.name} updated to "${newPasswordInput.trim()}".`,
      });
      setResettingEmp(null);
      setNewPasswordInput('');
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to update employee password.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleDelete = async (id: string, empName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${empName}? Their attendance logs will also be removed.`)) {
      return;
    }

    setDeletingId(id);
    try {
      await api.deleteEmployee(id);
      setMessage({
        type: 'success',
        text: `Employee "${empName}" deleted successfully.`,
      });
      onEmployeeCreated();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to delete employee.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Staff Enrollment & User Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enroll genuine team members with real credentials for real-time live attendance tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearAllData}
            title="Wipe any old test/mock records so only genuine real-time data is stored"
            className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
          >
            Clear All Test Data (Start Fresh)
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {message && (
        <div
          className={`text-xs font-medium px-4 py-3 rounded-lg border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Grid: Form + Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Enrollment Form (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-900 text-white text-xs font-bold">
              +
            </span>
            <h2 className="text-sm font-bold text-slate-900">
              Enroll New Employee
            </h2>
          </div>

          <form onSubmit={handleEnroll} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Connor"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Official Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. sarah.connor@company.com"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Must be unique. Enforced by MongoDB index.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Initial Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. 123456"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                The employee will use this password to sign into the attendance terminal.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
              >
                {predefinedDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {department === 'Custom...' && (
                <input
                  type="text"
                  required
                  placeholder="Enter custom department name"
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                  className="mt-2 w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Scheduled Shift Start
              </label>
              <select
                value={shiftStart}
                onChange={(e) => setShiftStart(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
              >
                {predefinedShifts.map((shift) => (
                  <option key={shift} value={shift}>
                    {shift}
                  </option>
                ))}
              </select>
              {shiftStart === 'Custom...' && (
                <input
                  type="text"
                  required
                  placeholder="e.g. 09:15 AM or 10:30 AM"
                  value={customShift}
                  onChange={(e) => setCustomShift(e.target.value)}
                  className="mt-2 w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              )}
              <span className="text-[11px] text-slate-400 mt-1 block">
                Arrivals &gt; 15 mins after shift start are automatically tagged as Late.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4 shadow-xs"
            >
              {isSubmitting ? 'Enrolling...' : 'Enroll Employee'}
            </button>
          </form>
        </div>

        {/* Right Column: Enrolled Staff Directory (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Active Staff Directory ({employees.length})
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                These users can select their profile and record real-time punch ins/outs.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Shift Start</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      No employees enrolled yet. Use the form on the left to enroll your first employee.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{emp.name}</div>
                        <div className="text-slate-400 text-[11px] truncate max-w-[200px]">
                          {emp.email}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{emp.department}</td>
                      <td className="py-3 px-4 font-mono text-slate-600 tabular-nums">
                        {emp.shift_start}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setResettingEmp({ id: emp._id, name: emp.name });
                            setNewPasswordInput('');
                          }}
                          className="text-xs text-slate-700 hover:text-slate-900 hover:underline font-medium"
                          title="Change or reset password for this user"
                        >
                          Reset Pwd
                        </button>
                        <span className="text-slate-200">|</span>
                        <button
                          type="button"
                          onClick={() => onSelectEmployeeForPunch(emp._id)}
                          className="text-xs text-slate-700 hover:text-slate-900 hover:underline font-medium"
                          title="Switch to Punch Terminal as this user"
                        >
                          Punch View
                        </button>
                        <span className="text-slate-200">|</span>
                        <button
                          type="button"
                          disabled={deletingId === emp._id}
                          onClick={() => handleDelete(emp._id, emp.name)}
                          className="text-xs text-rose-600 hover:text-rose-800 hover:underline font-medium disabled:opacity-50"
                        >
                          {deletingId === emp._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {resettingEmp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Reset Password for {resettingEmp.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter a new password for this employee. They will use this password to sign into their attendance terminal.
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. newpass123"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResettingEmp(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting || !newPasswordInput.trim()}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md disabled:opacity-50"
                >
                  {isResetting ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
