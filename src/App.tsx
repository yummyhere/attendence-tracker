import { useState, useEffect } from 'react';
import { UserHeader } from './components/UserHeader.js';
import { UserLoginView } from './components/UserLoginView.js';
import { AdminTopNav, AdminTab } from './components/AdminTopNav.js';
import { AdminLoginView } from './components/AdminLoginView.js';
import { EnrollEmployeeView } from './components/EnrollEmployeeView.js';
import { EmployeePunchView } from './components/EmployeePunchView.js';
import { AdminDashboard } from './components/AdminDashboard.js';
import { LateArrivalsView } from './components/LateArrivalsView.js';
import { HistoryQueryView } from './components/HistoryQueryView.js';
import { DepartmentFilterView } from './components/DepartmentFilterView.js';
import { AnalyticsView } from './components/AnalyticsView.js';
import { IndexExplainView } from './components/IndexExplainView.js';
import { Employee } from './types/index.js';
import { api } from './services/api.js';

interface AdminSession {
  name: string;
  email: string;
}

const checkIsAdminPath = (): boolean => {
  if (typeof window === 'undefined') return false;
  const pathname = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    hash === '#/admin' ||
    hash === '#admin'
  );
};

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(checkIsAdminPath);
  const [adminUser, setAdminUser] = useState<AdminSession | null>(() => {
    try {
      const stored = sessionStorage.getItem('office_admin_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Logged-in employee state (Normal User Authentication)
  const [loggedInEmployee, setLoggedInEmployee] = useState<Employee | null>(() => {
    try {
      const stored = sessionStorage.getItem('office_user_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [adminTab, setAdminTab] = useState<AdminTab>('enroll');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [adminSelectedEmployeeId, setAdminSelectedEmployeeId] = useState<string>('');
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync URL changes (popstate & hashchange)
  useEffect(() => {
    const handleUrlChange = () => {
      setIsAdminRoute(checkIsAdminPath());
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path);
    setIsAdminRoute(
      path === '/admin' ||
      path.startsWith('/admin/') ||
      path === '#/admin' ||
      path === '#admin'
    );
  };

  // Fetch employees for Admin portal
  const fetchEmployees = async () => {
    try {
      const res = await api.getEmployees();
      setEmployees(res.data);
      if (res.data.length > 0) {
        if (!adminSelectedEmployeeId || !res.data.some((e) => e._id === adminSelectedEmployeeId)) {
          setAdminSelectedEmployeeId(res.data[0]._id);
        }
      } else {
        setAdminSelectedEmployeeId('');
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [updateTrigger]);

  const handlePunchSuccess = () => {
    setUpdateTrigger((prev) => prev + 1);
  };

  // User Login Handlers
  const handleUserLoginSuccess = (employee: Employee) => {
    setLoggedInEmployee(employee);
    try {
      sessionStorage.setItem('office_user_session', JSON.stringify(employee));
    } catch (e) {
      console.error('Failed to save user session:', e);
    }
    setToastMessage(`Welcome back, ${employee.name}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUserLogout = () => {
    setLoggedInEmployee(null);
    try {
      sessionStorage.removeItem('office_user_session');
    } catch (e) {
      console.error('Failed to clear user session:', e);
    }
    setToastMessage('Signed out successfully');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Admin Login Handlers
  const handleAdminLogin = (user: AdminSession) => {
    setAdminUser(user);
    try {
      sessionStorage.setItem('office_admin_session', JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save admin session:', e);
    }
    setToastMessage(`Welcome back, ${user.name}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    try {
      sessionStorage.removeItem('office_admin_session');
    } catch (e) {
      console.error('Failed to clear admin session:', e);
    }
    navigateTo('/');
    setToastMessage('Signed out of Admin Panel');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleClearAllData = async () => {
    if (
      !window.confirm(
        'Clear all attendance logs and employee records? The system will be 100% clean for real-time live data.'
      )
    ) {
      return;
    }
    try {
      const res = await api.clearAllData();
      setToastMessage(res.message);
      setLoggedInEmployee(null);
      try {
        sessionStorage.removeItem('office_user_session');
      } catch {}
      setUpdateTrigger((prev) => prev + 1);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to clear data.');
    }
  };

  const handleSelectEmployeeForHistory = (employeeId: string) => {
    setAdminSelectedEmployeeId(employeeId);
    setAdminTab('history');
  };

  const handleAdminTestPunch = (employeeId: string) => {
    const targetEmp = employees.find((e) => e._id === employeeId);
    if (targetEmp) {
      setLoggedInEmployee(targetEmp);
      try {
        sessionStorage.setItem('office_user_session', JSON.stringify(targetEmp));
      } catch {}
    }
    navigateTo('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-slate-200">
      {/* 
        SECURITY & SEPARATION ARCHITECTURE:
        1. If user is at /admin:
           - If authenticated as admin: Show Admin Panel with AdminTopNav and all management tabs.
           - If not authenticated: Show Admin Login Screen (requires admin email & password).
        2. If user is at / (Regular User):
           - Admin panel is 100% HIDDEN. No admin tabs, no admin links, no hints in footer.
           - If user is NOT logged in: Show User Login Screen (asks for email & password set by admin).
           - If user IS logged in: Show their personal punch in/out terminal and logout button.
      */}
      {isAdminRoute ? (
        adminUser ? (
          // Admin Panel View (Authenticated)
          <>
            <AdminTopNav
              adminTab={adminTab}
              setAdminTab={setAdminTab}
              onLogoutAdmin={handleAdminLogout}
              onClearAll={handleClearAllData}
              adminEmail={adminUser.email}
            />

            {toastMessage && (
              <div className="bg-slate-900 text-white text-xs py-2 px-4 text-center font-medium shadow-md">
                {toastMessage}
              </div>
            )}

            <main className="flex-1 pb-16">
              {adminTab === 'enroll' && (
                <EnrollEmployeeView
                  employees={employees}
                  onEmployeeCreated={() => setUpdateTrigger((p) => p + 1)}
                  onSelectEmployeeForPunch={handleAdminTestPunch}
                  onClearAllData={handleClearAllData}
                />
              )}

              {adminTab === 'roster' && (
                <AdminDashboard
                  onSelectEmployeeForHistory={handleSelectEmployeeForHistory}
                  onSelectEmployeeForPunch={handleAdminTestPunch}
                  lastUpdatedTrigger={updateTrigger}
                />
              )}

              {adminTab === 'late' && (
                <LateArrivalsView
                  onSelectEmployeeForHistory={handleSelectEmployeeForHistory}
                />
              )}

              {adminTab === 'history' && (
                <HistoryQueryView
                  employees={employees}
                  selectedEmployeeId={adminSelectedEmployeeId}
                  onSelectEmployee={setAdminSelectedEmployeeId}
                />
              )}

              {adminTab === 'departments' && <DepartmentFilterView />}

              {adminTab === 'analytics' && <AnalyticsView />}

              {adminTab === 'index' && (
                <IndexExplainView
                  employees={employees}
                  selectedEmployeeId={adminSelectedEmployeeId}
                  onSelectEmployee={setAdminSelectedEmployeeId}
                />
              )}
            </main>
          </>
        ) : (
          // Admin Login Screen (/admin without authentication)
          <div className="flex-1 flex flex-col justify-center">
            <AdminLoginView
              onLoginSuccess={handleAdminLogin}
              onBackToUserView={() => navigateTo('/')}
            />
          </div>
        )
      ) : (
        // Regular Employee Experience (Admin completely hidden)
        loggedInEmployee ? (
          // Logged-in Employee Personal Terminal
          <>
            <UserHeader
              currentEmployee={loggedInEmployee}
              onLogout={handleUserLogout}
            />

            {toastMessage && (
              <div className="bg-slate-900 text-white text-xs py-2 px-4 text-center font-medium shadow-md">
                {toastMessage}
              </div>
            )}

            <main className="flex-1 pb-16">
              <EmployeePunchView
                employee={loggedInEmployee}
                onPunchSuccess={handlePunchSuccess}
              />
            </main>
          </>
        ) : (
          // User Login Page (Requires Email and Password set by Admin)
          <div className="flex-1 flex flex-col justify-center">
            {toastMessage && (
              <div className="bg-slate-900 text-white text-xs py-2 px-4 text-center font-medium shadow-md">
                {toastMessage}
              </div>
            )}
            <UserLoginView onLoginSuccess={handleUserLoginSuccess} />
          </div>
        )
      )}

      {/* Footer: Secure & Clean (NO admin links for normal users) */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">OfficeTrack</span>
            <span aria-hidden="true">·</span>
            <span>
              {isAdminRoute
                ? 'Administrator Control Panel'
                : 'Employee Attendance & Activity Portal'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            {isAdminRoute && (
              <button
                onClick={() => navigateTo('/')}
                className="text-slate-600 hover:text-slate-900 font-medium underline"
              >
                Go to Employee Portal
              </button>
            )}
            <span className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} OfficeTrack Enterprise
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
