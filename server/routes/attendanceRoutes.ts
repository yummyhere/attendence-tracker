import { Router } from 'express';
import { AttendanceController } from '../controllers/attendanceController.js';

const router = Router();

// Phase 2: Core punch in / punch out endpoint (atomic upsert)
router.post('/punch', AttendanceController.punch);

// Live today roster
router.get('/roster', AttendanceController.getRoster);

// Phase 3.1: Query late employees today
router.get('/late', AttendanceController.getLateEmployees);

// Phase 3.2: Attendance history with $and + $eq and date range
router.get('/history/:employeeId', AttendanceController.getEmployeeHistory);

// Phase 3.3: Filter attendance across multiple departments using $in & $lookup
router.get('/filter-departments', AttendanceController.filterAttendanceByDepartments);

// Phase 4.1: Aggregation pipeline for total hours worked ($project, $subtract/$dateDiff)
router.get('/total-hours', AttendanceController.getTotalHoursWorked);

// Phase 4.2: Aggregation pipeline for monthly report ($match, $group by employee & status)
router.get('/monthly-report', AttendanceController.getMonthlyReport);

// Phase 5: Index explain comparison (.explain("executionStats"))
router.get('/explain-index', AttendanceController.explainIndex);

export default router;
