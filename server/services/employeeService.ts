import { Employee, IEmployee } from '../models/Employee.js';

export class EmployeeService {
  static async getAllEmployees(): Promise<IEmployee[]> {
    return await Employee.find().sort({ department: 1, name: 1 });
  }

  static async getEmployeeById(id: string): Promise<IEmployee | null> {
    return await Employee.findById(id);
  }

  static async createEmployee(data: {
    name: string;
    email: string;
    password?: string;
    department: string;
    shift_start?: string;
  }): Promise<IEmployee> {
    const existing = await Employee.findOne({ email: data.email.toLowerCase().trim() });
    if (existing) {
      throw new Error(`Employee with email ${data.email} already exists.`);
    }

    const employee = new Employee({
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      password: data.password?.trim() || '123456',
      department: data.department.trim(),
      shift_start: data.shift_start?.trim() || '09:00 AM',
    });

    return await employee.save();
  }

  static async verifyEmployeeLogin(
    email: string,
    passwordAttempt: string
  ): Promise<IEmployee> {
    const cleanEmail = email.toLowerCase().trim();
    const employee = await Employee.findOne({ email: cleanEmail });
    if (!employee) {
      throw new Error('No employee found with this email address.');
    }

    const expectedPassword = employee.password || '123456';
    if (expectedPassword !== passwordAttempt) {
      throw new Error('Incorrect password. Please verify with your office administrator.');
    }

    return employee;
  }

  static async updateEmployeePassword(id: string, newPassword: string): Promise<boolean> {
    const employee = await Employee.findById(id);
    if (!employee) return false;
    employee.password = newPassword.trim();
    await employee.save();
    return true;
  }

  static async deleteEmployee(id: string): Promise<boolean> {
    const deleted = await Employee.findByIdAndDelete(id);
    if (!deleted) return false;
    // Also remove any attendance records for this employee
    const { Attendance } = await import('../models/Attendance.js');
    await Attendance.deleteMany({ employee_id: id });
    return true;
  }

  static async clearAllData(): Promise<{ employeesCleared: number; attendanceCleared: number }> {
    const { Attendance } = await import('../models/Attendance.js');
    const attResult = await Attendance.deleteMany({});
    const empResult = await Employee.deleteMany({});
    return {
      employeesCleared: empResult.deletedCount || 0,
      attendanceCleared: attResult.deletedCount || 0,
    };
  }

  static async getDistinctDepartments(): Promise<string[]> {
    return await Employee.distinct('department');
  }
}
