export interface Employee {
  _id: string;
  name: string;
  email: string;
  password?: string;
  department: string;
  shift_start: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivityLog {
  action: 'Login' | 'Logout';
  time: string;
}

export interface AttendanceRecord {
  _id: string;
  employee_id: string | Employee;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
  first_login_time?: string;
  last_logout_time?: string;
  activity_logs: ActivityLog[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RosterItem {
  employee: Employee;
  attendance: AttendanceRecord | null;
  status: 'Present' | 'Absent' | 'Late';
  currentClockState: 'In' | 'Out' | 'Not Started';
  first_login_time: string | null;
  last_logout_time: string | null;
  activity_logs: ActivityLog[];
  hoursWorked: number;
}

export interface LateEmployeeItem {
  _id: string;
  employee_id: string;
  name: string;
  email: string;
  department: string;
  shift_start: string;
  date: string;
  first_login_time: string;
  formatted_login: string;
  status: 'Late';
}

export interface TotalHoursItem {
  _id: string;
  employee_id: string;
  date: string;
  status: string;
  first_login_time: string;
  last_logout_time?: string;
  total_hours: number;
  employee: Employee;
  activity_logs: ActivityLog[];
}

export interface MonthlyReportItem {
  employee_id: string;
  name: string;
  email: string;
  department: string;
  shift_start: string;
  month: string;
  present_days: number;
  late_days: number;
  absent_days: number;
  total_logged_days: number;
}

export interface ExplainStatsResult {
  summary: {
    collectionSize: number;
    targetEmployeeId: string;
    compoundIndex: {
      name: string;
      fields: Record<string, number>;
      stage: string;
      totalDocsExamined: number;
      totalKeysExamined: number;
      nReturned: number;
      executionTimeMillis: number;
    };
    collectionScan: {
      name: string;
      stage: string;
      totalDocsExamined: number;
      totalKeysExamined: number;
      nReturned: number;
      executionTimeMillis: number;
    };
    analysis: string;
  };
  rawWithIndex: any;
  rawWithoutIndex: any;
}
