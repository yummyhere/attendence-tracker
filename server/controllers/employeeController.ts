import { Request, Response } from 'express';
import { EmployeeService } from '../services/employeeService.js';
import { seedDatabase } from '../seed.js';

export class EmployeeController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const employees = await EmployeeService.getAllEmployees();
      res.status(200).json({
        success: true,
        count: employees.length,
        data: employees,
      });
    } catch (error: any) {
      console.error('[EmployeeController.getAll] Error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch employees.' });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const employee = await EmployeeService.getEmployeeById(id);
      if (!employee) {
        res.status(404).json({ error: 'Employee not found.' });
        return;
      }
      res.status(200).json({
        success: true,
        data: employee,
      });
    } catch (error: any) {
      console.error('[EmployeeController.getById] Error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch employee.' });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, department, shift_start } = req.body;
      if (!name || !email || !department) {
        res.status(400).json({ error: 'name, email, and department are required.' });
        return;
      }

      const created = await EmployeeService.createEmployee({
        name,
        email,
        password,
        department,
        shift_start,
      });

      res.status(201).json({
        success: true,
        data: created,
      });
    } catch (error: any) {
      console.error('[EmployeeController.create] Error:', error);
      res.status(400).json({ error: error.message || 'Failed to create employee.' });
    }
  }

  static async userLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const employee = await EmployeeService.verifyEmployeeLogin(email, password);
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          _id: employee._id,
          name: employee.name,
          email: employee.email,
          department: employee.department,
          shift_start: employee.shift_start,
        },
      });
    } catch (error: any) {
      console.error('[EmployeeController.userLogin] Error:', error);
      res.status(401).json({ error: error.message || 'Authentication failed.' });
    }
  }

  static async updatePassword(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      if (!newPassword || newPassword.trim().length < 4) {
        res.status(400).json({ error: 'Password must be at least 4 characters.' });
        return;
      }

      const success = await EmployeeService.updateEmployeePassword(id, newPassword);
      if (!success) {
        res.status(404).json({ error: 'Employee not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Employee password updated successfully.',
      });
    } catch (error: any) {
      console.error('[EmployeeController.updatePassword] Error:', error);
      res.status(500).json({ error: error.message || 'Failed to update password.' });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await EmployeeService.deleteEmployee(id);
      if (!success) {
        res.status(404).json({ error: 'Employee not found.' });
        return;
      }
      res.status(200).json({
        success: true,
        message: 'Employee and associated attendance records deleted.',
      });
    } catch (error: any) {
      console.error('[EmployeeController.delete] Error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete employee.' });
    }
  }

  static async clearAll(req: Request, res: Response): Promise<void> {
    try {
      const result = await EmployeeService.clearAllData();
      res.status(200).json({
        success: true,
        message: 'All sample and attendance data cleared successfully. System is now ready for 100% real-time data.',
        data: result,
      });
    } catch (error: any) {
      console.error('[EmployeeController.clearAll] Error:', error);
      res.status(500).json({ error: error.message || 'Failed to clear data.' });
    }
  }

  static async getDepartments(req: Request, res: Response): Promise<void> {
    try {
      const departments = await EmployeeService.getDistinctDepartments();
      res.status(200).json({
        success: true,
        data: departments,
      });
    } catch (error: any) {
      console.error('[EmployeeController.getDepartments] Error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch departments.' });
    }
  }

  static async reseed(req: Request, res: Response): Promise<void> {
    try {
      const result = await seedDatabase();
      res.status(200).json({
        success: true,
        message: 'Database seeded successfully with sample employees and attendance history.',
        data: result,
      });
    } catch (error: any) {
      console.error('[EmployeeController.reseed] Error:', error);
      res.status(500).json({ error: error.message || 'Failed to seed database.' });
    }
  }

  static async adminLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const defaultEmail = process.env.ADMIN_EMAIL || 'admin@office.internal';
      const defaultPass = process.env.ADMIN_PASSWORD || 'admin123';

      if (
        email &&
        password &&
        email.trim().toLowerCase() === defaultEmail.toLowerCase() &&
        password === defaultPass
      ) {
        res.status(200).json({
          success: true,
          message: 'Admin authentication successful',
          user: {
            name: 'Office Administrator',
            email: defaultEmail,
            role: 'admin',
          },
          token: 'office-admin-authorized-token',
        });
        return;
      }

      res.status(401).json({
        success: false,
        error: 'Invalid admin email or password.',
      });
    } catch (error: any) {
      console.error('[EmployeeController.adminLogin] Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error during authentication.' });
    }
  }
}

