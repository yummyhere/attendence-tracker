import { Types } from 'mongoose';
import dayjs from 'dayjs';
import { Attendance, IAttendance } from '../models/Attendance.js';
import { Employee, IEmployee } from '../models/Employee.js';

export interface PunchResult {
  attendance: IAttendance;
  action: 'Login' | 'Logout';
  status: 'Present' | 'Absent' | 'Late';
  isFirstPunchToday: boolean;
  message: string;
}

export class AttendanceService {
  /**
   * Helper: parses shift string (e.g. "09:00 AM") and returns dayjs threshold with 15-min grace
   */
  private static getShiftGraceThreshold(shiftStartStr: string, dateStr: string): dayjs.Dayjs {
    const [timeStr, period] = (shiftStartStr || '09:00 AM').split(' ');
    let [hours, minutes] = (timeStr || '09:00').split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const base = dayjs(dateStr).hour(hours).minute(minutes).second(0).millisecond(0);
    // 15-minute grace period (e.g., 09:15 AM)
    return base.add(15, 'minute');
  }

  /**
   * Phase 2: Single atomic Mongoose operation for Punch In/Out
   * Checks if document exists for { employee_id, date: today }.
   * If not: creates document with upsert: true, sets first_login_time, status (Present/Late), pushes Login log.
   * If it exists: uses $push to append event into activity_logs, updates last_logout_time (for Logout).
   */
  static async punch(
    employeeId: string,
    requestedAction?: 'Login' | 'Logout'
  ): Promise<PunchResult> {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new Error(`Employee with ID ${employeeId} not found.`);
    }

    const now = new Date();
    const todayStr = dayjs(now).format('YYYY-MM-DD');
    const empObjectId = new Types.ObjectId(employeeId);

    // Calculate whether arrival is Late (> 15 min after shift_start)
    const graceThreshold = this.getShiftGraceThreshold(employee.shift_start, todayStr);
    const isLate = dayjs(now).isAfter(graceThreshold);
    const calculatedStatus: 'Present' | 'Late' = isLate ? 'Late' : 'Present';

    // If caller didn't specify action, inspect current state to toggle
    let action: 'Login' | 'Logout' = requestedAction || 'Login';
    if (!requestedAction) {
      const existing = await Attendance.findOne({ employee_id: empObjectId, date: todayStr });
      if (existing && existing.activity_logs.length > 0) {
        const lastLog = existing.activity_logs[existing.activity_logs.length - 1];
        action = lastLog.action === 'Login' ? 'Logout' : 'Login';
      } else {
        action = 'Login';
      }
    }

    // Atomic update object
    const updateDoc: any = {
      $setOnInsert: {
        employee_id: empObjectId,
        date: todayStr,
        first_login_time: now,
        status: calculatedStatus,
      },
      $push: {
        activity_logs: { action, time: now },
      },
    };

    if (action === 'Logout') {
      updateDoc.$set = { last_logout_time: now };
    }

    // Single atomic Mongoose operation
    const updated = await Attendance.findOneAndUpdate(
      { employee_id: empObjectId, date: todayStr },
      updateDoc,
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    ).populate('employee_id');

    if (!updated) {
      throw new Error('Failed to record punch operation.');
    }

    const isFirstPunchToday = updated.activity_logs.length === 1;
    const message = action === 'Login'
      ? `Successfully punched in (${updated.status}) at ${dayjs(now).format('hh:mm A')}`
      : `Successfully punched out at ${dayjs(now).format('hh:mm A')}`;

    return {
      attendance: updated,
      action,
      status: updated.status,
      isFirstPunchToday,
      message,
    };
  }

  /**
   * Phase 3.1: Query employees marked "Late" today
   * first_login_time compared against 09:15 AM (or shift grace threshold)
   */
  static async getLateEmployees(dateStr?: string) {
    const targetDate = dateStr || dayjs().format('YYYY-MM-DD');

    // Query documents for targetDate with status 'Late' or first_login_time > 09:15 AM
    const lateRecords = await Attendance.find({
      date: targetDate,
      status: 'Late',
    })
      .populate('employee_id')
      .sort({ first_login_time: 1 });

    return lateRecords.map((record) => {
      const emp = record.employee_id as unknown as IEmployee;
      const loginTime = record.first_login_time ? dayjs(record.first_login_time) : null;
      return {
        _id: record._id,
        employee_id: emp?._id || record.employee_id,
        name: emp?.name || 'Unknown',
        email: emp?.email || 'N/A',
        department: emp?.department || 'N/A',
        shift_start: emp?.shift_start || '09:00 AM',
        date: record.date,
        first_login_time: record.first_login_time,
        formatted_login: loginTime ? loginTime.format('hh:mm A') : 'N/A',
        status: record.status,
      };
    });
  }

  /**
   * Phase 3.2: Fetch a specific employee's attendance history
   * Uses $and + $eq on employee_id and a date range
   */
  static async getEmployeeHistory(employeeId: string, startDate?: string, endDate?: string) {
    const empObjectId = new Types.ObjectId(employeeId);

    const conditions: any[] = [
      { employee_id: { $eq: empObjectId } },
    ];

    if (startDate && endDate) {
      conditions.push({
        date: { $gte: startDate, $lte: endDate },
      });
    } else if (startDate) {
      conditions.push({
        date: { $gte: startDate },
      });
    } else if (endDate) {
      conditions.push({
        date: { $lte: endDate },
      });
    }

    const history = await Attendance.find({
      $and: conditions,
    })
      .sort({ date: -1 })
      .populate('employee_id');

    return history;
  }

  /**
   * Phase 3.3: Filter attendance across multiple departments using $in
   * Requires a $lookup to employees collection for department field
   */
  static async filterAttendanceByDepartments(departments: string[], dateStr?: string) {
    const targetDate = dateStr || dayjs().format('YYYY-MM-DD');

    const pipeline: any[] = [
      {
        $match: { date: targetDate },
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee_id',
          foreignField: '_id',
          as: 'employee',
        },
      },
      {
        $unwind: '$employee',
      },
      {
        $match: {
          'employee.department': { $in: departments },
        },
      },
      {
        $sort: { 'employee.name': 1 },
      },
    ];

    return await Attendance.aggregate(pipeline);
  }

  /**
   * Phase 4.1: Total Hours Worked
   * Uses $project with $subtract (millisecond difference) converted to hours
   * Handles active shifts (first_login_time to current time) vs completed shifts
   */
  static async getTotalHoursWorked(dateStr?: string) {
    const targetDate = dateStr || dayjs().format('YYYY-MM-DD');
    const now = new Date();

    const results = await Attendance.aggregate([
      {
        $match: {
          date: targetDate,
          first_login_time: { $exists: true },
        },
      },
      {
        $project: {
          employee_id: 1,
          date: 1,
          status: 1,
          first_login_time: 1,
          last_logout_time: 1,
          activity_logs: 1,
          total_hours: {
            $cond: {
              if: { $and: ['$first_login_time', '$last_logout_time'] },
              then: {
                $round: [
                  {
                    $divide: [
                      { $subtract: ['$last_logout_time', '$first_login_time'] },
                      3600000, // convert ms to hours
                    ],
                  },
                  2,
                ],
              },
              else: {
                // If currently punched in without logout yet: calculate live duration
                $round: [
                  {
                    $divide: [
                      { $subtract: [now, '$first_login_time'] },
                      3600000,
                    ],
                  },
                  2,
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee_id',
          foreignField: '_id',
          as: 'employee',
        },
      },
      {
        $unwind: '$employee',
      },
      {
        $sort: { total_hours: -1 },
      },
    ]);

    return results;
  }

  /**
   * Phase 4.2: Monthly Report
   * Uses $match (current month) -> $group by employee_id and status -> count Present vs Absent vs Late days
   * Returns a clean summary array, not raw counts
   */
  static async getMonthlyReport(yearMonth?: string) {
    const currentMonth = yearMonth || dayjs().format('YYYY-MM');
    const regex = new RegExp(`^${currentMonth}`);

    const report = await Attendance.aggregate([
      {
        $match: {
          date: { $regex: regex },
        },
      },
      {
        $group: {
          _id: {
            employee_id: '$employee_id',
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.employee_id',
          statusCounts: {
            $push: {
              status: '$_id.status',
              count: '$count',
            },
          },
          totalLoggedDays: { $sum: '$count' },
        },
      },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'employee',
        },
      },
      {
        $unwind: '$employee',
      },
      {
        $project: {
          _id: 0,
          employee_id: '$_id',
          name: '$employee.name',
          email: '$employee.email',
          department: '$employee.department',
          shift_start: '$employee.shift_start',
          month: { $literal: currentMonth },
          present_days: {
            $reduce: {
              input: '$statusCounts',
              initialValue: 0,
              in: {
                $cond: [{ $eq: ['$$this.status', 'Present'] }, '$$this.count', '$$value'],
              },
            },
          },
          late_days: {
            $reduce: {
              input: '$statusCounts',
              initialValue: 0,
              in: {
                $cond: [{ $eq: ['$$this.status', 'Late'] }, '$$this.count', '$$value'],
              },
            },
          },
          absent_days: {
            $reduce: {
              input: '$statusCounts',
              initialValue: 0,
              in: {
                $cond: [{ $eq: ['$$this.status', 'Absent'] }, '$$this.count', '$$value'],
              },
            },
          },
          total_logged_days: '$totalLoggedDays',
        },
      },
      {
        $sort: { name: 1 },
      },
    ]);

    return report;
  }

  /**
   * Phase 5: Index Performance comparison (.explain("executionStats"))
   * Executes query with index hint vs COLLSCAN ($natural hint)
   */
  static async explainIndexPerformance(sampleEmployeeId?: string) {
    let empId = sampleEmployeeId;
    if (!empId) {
      const anyAtt = await Attendance.findOne();
      empId = anyAtt?.employee_id.toString();
    }

    if (!empId) {
      const anyEmp = await Employee.findOne();
      empId = anyEmp?._id.toString();
    }

    if (!empId) {
      throw new Error('No employee records available to run explain test.');
    }

    const empObjectId = new Types.ObjectId(empId);
    const query = {
      employee_id: empObjectId,
      date: { $gte: '2026-01-01', $lte: '2026-12-31' },
    };

    // 1. With compound index { employee_id: 1, date: -1 }
    const withIndexExplain: any = await Attendance.find(query)
      .hint({ employee_id: 1, date: -1 })
      .explain('executionStats');

    // 2. Without index (enforce collection scan using $natural)
    const withoutIndexExplain: any = await Attendance.find(query)
      .hint({ $natural: 1 })
      .explain('executionStats');

    const totalDocsInCollection = await Attendance.countDocuments();

    const withStats = withIndexExplain.executionStats || {};
    const withoutStats = withoutIndexExplain.executionStats || {};

    const summary = {
      collectionSize: totalDocsInCollection,
      targetEmployeeId: empId,
      compoundIndex: {
        name: 'employee_id_1_date_-1',
        fields: { employee_id: 1, date: -1 },
        stage: withStats.executionStages?.stage || 'IXSCAN/FETCH',
        totalDocsExamined: withStats.totalDocsExamined ?? 0,
        totalKeysExamined: withStats.totalKeysExamined ?? 0,
        nReturned: withStats.nReturned ?? 0,
        executionTimeMillis: withStats.executionTimeMillis ?? 0,
      },
      collectionScan: {
        name: 'COLLSCAN ($natural)',
        stage: withoutStats.executionStages?.stage || 'COLLSCAN',
        totalDocsExamined: withoutStats.totalDocsExamined ?? 0,
        totalKeysExamined: withoutStats.totalKeysExamined ?? 0,
        nReturned: withoutStats.nReturned ?? 0,
        executionTimeMillis: withoutStats.executionTimeMillis ?? 0,
      },
      analysis: `The compound index { employee_id: 1, date: -1 } narrowed document inspection directly via B-tree key examination (totalDocsExamined: ${withStats.totalDocsExamined ?? 0}) compared to full table sweep (totalDocsExamined: ${withoutStats.totalDocsExamined ?? 0}) across ${totalDocsInCollection} documents. Execution stage shifted from full COLLSCAN to targeted IXSCAN + FETCH.`,
    };

    return {
      summary,
      rawWithIndex: withIndexExplain,
      rawWithoutIndex: withoutIndexExplain,
    };
  }

  /**
   * Helper: Get Today's Live Attendance Roster with calculated hours and live statuses
   */
  static async getTodayRoster(dateStr?: string) {
    const targetDate = dateStr || dayjs().format('YYYY-MM-DD');
    const employees = await Employee.find().sort({ department: 1, name: 1 });
    const attendanceRecords = await Attendance.find({ date: targetDate });

    const attendanceMap = new Map<string, IAttendance>();
    attendanceRecords.forEach((att) => {
      attendanceMap.set(att.employee_id.toString(), att);
    });

    const now = new Date();

    return employees.map((emp) => {
      const att = attendanceMap.get(emp._id.toString());
      let currentClockState: 'In' | 'Out' | 'Not Started' = 'Not Started';
      let hoursWorked = 0;

      if (att && att.activity_logs && att.activity_logs.length > 0) {
        const lastLog = att.activity_logs[att.activity_logs.length - 1];
        currentClockState = lastLog.action === 'Login' ? 'In' : 'Out';

        // Calculate hours worked
        if (att.first_login_time) {
          const endTime = att.last_logout_time ? att.last_logout_time : (currentClockState === 'In' ? now : att.first_login_time);
          const diffMs = Math.max(0, new Date(endTime).getTime() - new Date(att.first_login_time).getTime());
          hoursWorked = Number((diffMs / 3600000).toFixed(2));
        }
      }

      return {
        employee: {
          _id: emp._id,
          name: emp.name,
          email: emp.email,
          department: emp.department,
          shift_start: emp.shift_start,
        },
        attendance: att || null,
        status: att ? att.status : 'Absent',
        currentClockState,
        first_login_time: att?.first_login_time || null,
        last_logout_time: att?.last_logout_time || null,
        activity_logs: att?.activity_logs || [],
        hoursWorked,
      };
    });
  }
}
