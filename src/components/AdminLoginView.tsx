import React, { useState } from 'react';
import { api } from '../services/api.js';

interface AdminLoginViewProps {
  onLoginSuccess: (adminUser: { name: string; email: string }) => void;
  onBackToUserView: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onLoginSuccess,
  onBackToUserView,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.adminLogin(email, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid admin email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
        {/* Back Link */}
        <button
          type="button"
          onClick={onBackToUserView}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium mb-6 transition-colors"
        >
          <span>← Back to Employee Clock In/Out</span>
        </button>

        {/* Title */}
        <div className="mb-6">
          <div className="inline-block text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded mb-2">
            Restricted Access
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Admin Portal Authentication
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Please sign in with administrator credentials to manage office attendance, live rosters, and analytics.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 text-xs font-medium px-3.5 py-2.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@company.com"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Admin Password
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
              <span>Authenticating...</span>
            ) : (
              <span>Sign In to Admin Panel</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
