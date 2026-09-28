import React, { useState } from 'react';
import { api } from '../services/api.js';
import { Employee } from '../types/index.js';

interface UserLoginViewProps {
  onLoginSuccess: (employee: Employee) => void;
}

export const UserLoginView: React.FC<UserLoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.userLogin(email.trim(), password);
      if (res.success && res.data) {
        onLoginSuccess(res.data);
      } else {
        setError(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify with your office administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
        {/* Title & Branding */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 text-white font-bold text-base mb-3 shadow-xs">
            OT
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Employee Portal Sign In
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Please sign in with your official office credentials to access your daily punch terminal and attendance records.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 text-xs font-medium px-3.5 py-2.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Work Email Address
            </label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. yourname@company.com"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs mt-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-3.5 w-3.5 text-white"
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
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In to Terminal</span>
            )}
          </button>
        </form>

        {/* Notice for Employees */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Credentials are assigned by management during staff enrollment. If you forgot your password, contact HR or your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
};
