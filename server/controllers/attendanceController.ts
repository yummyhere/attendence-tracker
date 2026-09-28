import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendanceService.js';

export class AttendanceController {
  /**
   * Phase 2: POST /api/attendance/punch
   * Single atomic Mongoose operation
   */
  static async punch(req: Request, res: Response): Promise<void> {
    try {
      const { employee_id, action } = req.body;

      if (!employee_id) {
        res.status(400).json({ error: 'employee_id is required in request body.' });
        return;
      }

      if (action && !['Login', 'Logout'].includes(action)) {
        res.status(400).json({ error: 'action must be either "Login" or "Logout" if specified.' });
        return;
      }

      const result = await AttendanceService.punch(employee_id, action);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[AttendanceController.punch] Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error while punching.' });
    }
  }

  /**
   * GET /api/attendance/roster
   * Fetch today's live roster with current punch state & hours worked
   */
  static async getRoster(req: Request, res: Response): Promise<void> {
    try {
      const date = (req.query.date as string) || undefined;
      const roster = await AttendanceService.getTodayRoster(date);
      res.status(200).json({
        success: true,
        data: roster,
      });
    } catch (error: any) {
      console.error('[AttendanceController.getRoster] Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error fetching roster.' });
    }
  }

  /**
   * Phase 3.1: GET /api/attendance/late
   * Employees marked "Late" today (first_login_time > 09:15 AM threshold)
   */
  static async getLateEmployees(req: Request, res: Response): Promise<void> {
    try {
      const date = (req.query.date as string) || undefined;
      const lateList = await AttendanceService.getLateEmployees(date);
      res.status(200).json({
        success: true,
        count: lateList.length,
        data: lateList,
      });
    } catch (error: any) {
      console.error('[AttendanceController.getLateEmployees] Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error querying late employees.' });
    }
  }

  /**
   * Phase 3.2: GET /api/attendance/history/:employeeId
   * Fetch a specific employee's attendance history using $and + $eq and date range
   */
  static async getEmployeeHistory(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const { startDate, endDate } = req.query;

      if (!employeeId) {
        res.status(400).json({ error: 'employeeId parameter is required.' });
        return;
      }

      const history = await AttendanceService.getEmployeeHistory(
        employeeId,
        startDate as string | undefined,
        endDate as string | undefined
      );

      res.status(200).json({
        success: true,
        count: history.length,
        data: history,
      });
    } catch (error: any) {
      console.error('[AttendanceController.getEmployeeHistory] Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error fetching employee history.' });
    }
  }

  /**
   * Phase 3.3: GET /api/attendance/filter-departments
   * Filter attendance across multiple departments using $in and $lookup
   */
  static async filterAttendanceByDepartments(req: Request, res: Response): Promise<void> {
    try {
      const { departments, date } = req.query;

      let deptArray: string[] = [];
      if (Array.isArray(departments)) {
        deptArray = departments as string[];
      } else if (typeof departments === 'string') {
        deptArray = departments.split(',').map((d) => d.trim()).filter(Boolean);
      }

      if (deptArray.length === 0) {
        res.status(400).json({ error: 'At least one department must be specified in query parameter departments.' });
        return;
      }

      const filtered = await AttendanceService.filterAttendanceByDepartments(
        deptArray,
        date as string | undefined
      );

      res.status(200).json({
        success: true,
        departments: deptArray,
        count: filtered.length,
        data: filtered,
      });
    } catch (error: any) {
      console.error('[AttendanceController.filterAttendanceByDepartments] Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error filtering by departments.' });
    }
  }

  /**
   * Phase 4.1: GET /api/attendance/total-hours
   * Aggregation pipeline: $project with $subtract/$dateDiff converted to hours
   */
  static async getTotalHoursWorked(req: Request, res: Response): Promise<void> {
    try {
      const date = (req.query.date as string) || undefined;
      const report = await AttendanceService.getTotalHoursWorked(date);

      res.status(200).json({
        success: true,
        count: report.length,
        data: report,
      });
    } catch (error: any) {
      console.error('[AttendanceController.getTotalHoursWorked] Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error calculating total hours.' });
    }
  }

  /**
   * Phase 4.2: GET /api/attendance/monthly-report
   * Aggregation pipeline: $match (current month) -> $group by employee and status -> clean summary array
   */
  static async getMonthlyReport(req: Request, res: Response): Promise<void> {
    try {
      const month = (req.query.month as string) || undefined;
      const summary = await AttendanceService.getMonthlyReport(month);

      res.status(200).json({
        success: true,
        month: month || new Date().toISOString().slice(0, 7),
        count: summary.length,
        data: summary,
      });
    } catch (error: any) {
      console.error('[AttendanceController.getMonthlyReport] Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error generating monthly report.' });
    }
  }

  /**
   * Phase 5: GET /api/attendance/explain-index
   * Run .explain("executionStats") comparing compound index vs collection scan
   */
  static async explainIndex(req: Request, res: Response): Promise<void> {
    try {
      const employeeId = (req.query.employeeId as string) || undefined;
      const stats = await AttendanceService.explainIndexPerformance(employeeId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('[AttendanceController.explainIndex] Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error running explain analysis.' });
    }
  }
}
