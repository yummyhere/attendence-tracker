import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Employee, AttendanceRecord } from '../types/index.js';
import { api } from '../services/api.js';

interface EmployeePunchViewProps {
  employee: Employee | null;
  onPunchSuccess: () => void;
}

export const EmployeePunchView: React.FC<EmployeePunchViewProps> = ({
  employee,
  onPunchSuccess,
}) => {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPunching, setIsPunching] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Live Clock updater (every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's record whenever selected employee changes
  useEffect(() => {
    if (!employee) return;

    let isMounted = true;
    setIsLoading(true);
    setFeedback(null);

    const todayStr = dayjs().format('YYYY-MM-DD');
    api
      .getEmployeeHistory(employee._id, todayStr, todayStr)
      .then((res) => {
        if (!isMounted) return;
        if (res.data && res.data.length > 0) {
          setAttendance(res.data[0]);
        } else {
          setAttendance(null);
        }
      })
      .catch((err) => {
        console.error('Failed to load employee attendance:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [employee]);

  // Determine current clock state (In vs Out vs Not Started)
  const isClockedIn = Boolean(
    attendance &&
      attendance.activity_logs &&
      attendance.activity_logs.length > 0 &&
      attendance.activity_logs[attendance.activity_logs.length - 1].action === 'Login'
  );

  const nextAction: 'Login' | 'Logout' = isClockedIn ? 'Logout' : 'Login';
  const buttonLabel = isClockedIn ? 'Punch Out' : 'Punch In';

  // Calculate live hours worked today
  const calculateLiveHours = () => {
    if (!attendance || !attendance.first_login_time) return '0.00';
    const firstLogin = dayjs(attendance.first_login_time);

    let end = currentTime;
    if (!isClockedIn && attendance.last_logout_time) {
      end = dayjs(attendance.last_logout_time);
    }
    const diffMs = Math.max(0, end.diff(firstLogin));
    return (diffMs / 3600000).toFixed(2);
  };

  const handlePunch = async () => {
    if (!employee || isPunching) return;

    setIsPunching(true);
    setFeedback(null);

    try {
      const res = await api.punch(employee._id, nextAction);
      setAttendance(res.data.attendance);
      setFeedback({
        type: 'success',
        message: res.data.message,
      });
      onPunchSuccess();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to record punch. Please try again.',
      });
    } finally {
      setIsPunching(false);
    }
  };

  if (!employee) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-200 rounded-xl shadow-xs text-center">
        <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-slate-500 mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
        </div>
        <h2 className="text-base font-bold text-slate-900 mb-1">
          Account Not Signed In
        </h2>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Please sign in with your office email and password to record your attendance.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6">
      {/* Container with single-elevation depth and subtle hairline border */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
        {/* Top Header: Employee details & shift */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {employee.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span>{employee.department}</span>
              <span aria-hidden="true">·</span>
              <span>{employee.email}</span>
              <span aria-hidden="true">·</span>
              <span>Shift: {employee.shift_start}</span>
            </div>
          </div>

          {/* Current Status Indicator */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-400 font-medium">CURRENT STATUS</div>
              <div className="flex items-center gap-2 mt-0.5 justify-end">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                  }`}
                />
                <span className="text-sm font-semibold text-slate-800">
                  {isClockedIn ? 'Clocked In' : attendance ? 'Clocked Out' : 'Not Started'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Clock Display */}
        <div className="py-10 text-center">
          <div className="text-xs tracking-wider uppercase font-semibold text-slate-400 mb-2">
            Standard Local Time
          </div>
          <div className="font-mono text-5xl sm:text-6xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {currentTime.format('HH:mm:ss')}
            <span className="text-2xl sm:text-3xl text-slate-400 ml-2 font-normal">
              {currentTime.format('A')}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {currentTime.format('dddd, MMMM D, YYYY')}
          </div>

          {/* Primary Action Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handlePunch}
              disabled={isPunching || isLoading}
              className={`min-w-[220px] py-3.5 px-8 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isClockedIn
                  ? 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-white focus:ring-slate-900 shadow-sm'
              } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {isPunching ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <span>{buttonLabel}</span>
              )}
            </button>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              className={`mt-4 text-xs font-medium px-4 py-2 rounded-md max-w-md mx-auto ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedback.message}
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100 text-center">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-xs text-slate-500">First Login Today</div>
            <div className="font-mono text-sm font-semibold text-slate-800 mt-1 tabular-nums">
              {attendance?.first_login_time
                ? dayjs(attendance.first_login_time).format('hh:mm A')
                : '—'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-xs text-slate-500">Last Logout</div>
            <div className="font-mono text-sm font-semibold text-slate-800 mt-1 tabular-nums">
              {attendance?.last_logout_time
                ? dayjs(attendance.last_logout_time).format('hh:mm A')
                : '—'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 col-span-2 sm:col-span-1">
            <div className="text-xs text-slate-500">Hours Logged Today</div>
            <div className="font-mono text-sm font-semibold text-slate-900 mt-1 tabular-nums">
              {calculateLiveHours()} hrs
            </div>
          </div>
        </div>

        {/* Activity Logs Timeline */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Today's Punch Activity ({attendance?.activity_logs?.length || 0} events)
          </h2>

          {!attendance || !attendance.activity_logs || attendance.activity_logs.length === 0 ? (
            <div className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No punch activity recorded for today yet. Click "Punch In" to start.
            </div>
          ) : (
            <div className="space-y-2">
              {attendance.activity_logs.map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 px-3 rounded-md bg-slate-50 text-xs border border-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        log.action === 'Login' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    <span className="font-medium text-slate-700">
                      {log.action === 'Login' ? 'Clocked In' : 'Clocked Out'}
                    </span>
                  </div>
                  <span className="font-mono text-slate-500 tabular-nums">
                    {dayjs(log.time).format('hh:mm:ss A')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
