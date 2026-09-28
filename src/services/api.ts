import {
  Employee,
  RosterItem,
  LateEmployeeItem,
  TotalHoursItem,
  MonthlyReportItem,
  ExplainStatsResult,
  AttendanceRecord,
} from '../types/index.js';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  return json;
}

export const api = {
  // Phase 2: Core Punch in/out
  async punch(employeeId: string, action?: 'Login' | 'Logout'): Promise<{
    success: boolean;
    data: {
      attendance: AttendanceRecord;
      action: 'Login' | 'Logout';
      status: 'Present' | 'Absent' | 'Late';
      isFirstPunchToday: boolean;
      message: string;
    };
  }> {
    const res = await fetch(`${API_BASE}/attendance/punch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_id: employeeId, action }),
    });
    return handleResponse(res);
  },

  // Today's live roster
  async getRoster(date?: string): Promise<{ success: boolean; data: RosterItem[] }> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await fetch(`${API_BASE}/attendance/roster${query}`);
    return handleResponse(res);
  },

  // Phase 3.1: Late employees today
  async getLateEmployees(date?: string): Promise<{ success: boolean; count: number; data: LateEmployeeItem[] }> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await fetch(`${API_BASE}/attendance/late${query}`);
    return handleResponse(res);
  },

  // Phase 3.2: Attendance history with $and + $eq and date range
  async getEmployeeHistory(
    employeeId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ success: boolean; count: number; data: AttendanceRecord[] }> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/attendance/history/${employeeId}${query}`);
    return handleResponse(res);
  },

  // Phase 3.3: Filter attendance across multiple departments using $in
  async filterDepartments(
    departments: string[],
    date?: string
  ): Promise<{ success: boolean; departments: string[]; count: number; data: any[] }> {
    const params = new URLSearchParams();
    params.append('departments', departments.join(','));
    if (date) params.append('date', date);
    const res = await fetch(`${API_BASE}/attendance/filter-departments?${params.toString()}`);
    return handleResponse(res);
  },

  // Phase 4.1: Total Hours Worked aggregation
  async getTotalHours(date?: string): Promise<{ success: boolean; count: number; data: TotalHoursItem[] }> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await fetch(`${API_BASE}/attendance/total-hours${query}`);
    return handleResponse(res);
  },

  // Phase 4.2: Monthly Report aggregation
  async getMonthlyReport(month?: string): Promise<{ success: boolean; month: string; count: number; data: MonthlyReportItem[] }> {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    const res = await fetch(`${API_BASE}/attendance/monthly-report${query}`);
    return handleResponse(res);
  },

  // Phase 5: Index Explain Stats comparison
  async getExplainStats(employeeId?: string): Promise<{ success: boolean; data: ExplainStatsResult }> {
    const query = employeeId ? `?employeeId=${encodeURIComponent(employeeId)}` : '';
    const res = await fetch(`${API_BASE}/attendance/explain-index${query}`);
    return handleResponse(res);
  },

  // Employees & departments
  async getEmployees(): Promise<{ success: boolean; count: number; data: Employee[] }> {
    const res = await fetch(`${API_BASE}/employees`);
    return handleResponse(res);
  },

  async getDepartments(): Promise<{ success: boolean; data: string[] }> {
    const res = await fetch(`${API_BASE}/departments`);
    return handleResponse(res);
  },

  async createEmployee(data: {
    name: string;
    email: string;
    password?: string;
    department: string;
    shift_start?: string;
  }): Promise<{ success: boolean; data: Employee }> {
    const res = await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async userLogin(email: string, password: string): Promise<{
    success: boolean;
    data: Employee;
    message?: string;
  }> {
    const res = await fetch(`${API_BASE}/employees/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async updateEmployeePassword(id: string, newPassword: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/employees/${id}/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    });
    return handleResponse(res);
  },

  async deleteEmployee(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/employees/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  async clearAllData(): Promise<{ success: boolean; message: string; data: { employeesCleared: number; attendanceCleared: number } }> {
    const res = await fetch(`${API_BASE}/clear-all`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  async reseed(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/seed`, { method: 'POST' });
    return handleResponse(res);
  },

  async adminLogin(email: string, password: string): Promise<{
    success: boolean;
    token?: string;
    user?: { name: string; email: string; role: string };
    error?: string;
    message?: string;
  }> {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },
};
