import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { Employee, IEmployee } from './models/Employee.js';
import { Attendance } from './models/Attendance.js';
import { connectDB } from './config/db.js';

export const SAMPLE_EMPLOYEES = [
  {
    name: 'Marcus Chen',
    email: 'marcus.chen@office.internal',
    department: 'Engineering',
    shift_start: '09:00 AM',
  },
  {
    name: 'Elena Rostova',
    email: 'elena.rostova@office.internal',
    department: 'Engineering',
    shift_start: '09:00 AM',
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@office.internal',
    department: 'Engineering',
    shift_start: '09:30 AM',
  },
  {
    name: 'David Kim',
    email: 'david.kim@office.internal',
    department: 'Product',
    shift_start: '09:00 AM',
  },
  {
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@office.internal',
    department: 'Product',
    shift_start: '09:00 AM',
  },
  {
    name: 'Alex Rivera',
    email: 'alex.rivera@office.internal',
    department: 'Design',
    shift_start: '09:00 AM',
  },
  {
    name: 'Maya Lin',
    email: 'maya.lin@office.internal',
    department: 'Design',
    shift_start: '10:00 AM',
  },
  {
    name: 'Carlos Gomez',
    email: 'carlos.gomez@office.internal',
    department: 'Operations',
    shift_start: '08:30 AM',
  },
  {
    name: 'Rachel Vance',
    email: 'rachel.vance@office.internal',
    department: 'Operations',
    shift_start: '09:00 AM',
  },
  {
    name: "Liam O'Connor",
    email: 'liam.oconnor@office.internal',
    department: 'Marketing',
    shift_start: '09:00 AM',
  },
];

export async function seedDatabase() {
  console.log('[Seed] Clearing existing employees and attendance records...');
  await Attendance.deleteMany({});
  await Employee.deleteMany({});

  console.log(`[Seed] Inserting ${SAMPLE_EMPLOYEES.length} sample employees...`);
  const createdEmployees: IEmployee[] = await Employee.insertMany(SAMPLE_EMPLOYEES);

  const today = dayjs();
  const attendanceDocs: any[] = [];

  // Seed 7 days of attendance history (past 6 days + today)
  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const currentDate = today.subtract(dayOffset, 'day');
    const dateStr = currentDate.format('YYYY-MM-DD');
    const isToday = dayOffset === 0;

    for (const emp of createdEmployees) {
      // Deterministic variation based on employee and day
      const hash = (emp.email.length + dayOffset) % 10;

      // 10% chance of being absent on past days
      if (!isToday && hash === 0) {
        attendanceDocs.push({
          employee_id: emp._id,
          date: dateStr,
          status: 'Absent',
          activity_logs: [],
        });
        continue;
      }

      // Today: some employees haven't arrived yet (Absent)
      if (isToday && (emp.name === 'Rachel Vance' || emp.name === "Liam O'Connor")) {
        continue; // No document yet or marked absent
      }

      // Determine login time
      // Some late (Elena, Priya on certain days, Alex today)
      let isLate = false;
      let loginHour = 8;
      let loginMinute = 50 + (hash % 10);

      if (emp.name === 'Elena Rostova' || (hash >= 7 && emp.name !== 'Marcus Chen')) {
        isLate = true;
        loginHour = 9;
        loginMinute = 20 + (hash % 15); // e.g. 09:22, 09:28
      } else if (emp.name === 'Alex Rivera' && isToday) {
        isLate = true;
        loginHour = 9;
        loginMinute = 35;
      } else if (emp.shift_start === '08:30 AM') {
        loginHour = 8;
        loginMinute = 22 + (hash % 5);
      } else if (emp.shift_start === '10:00 AM') {
        loginHour = 9;
        loginMinute = 52;
      }

      const loginTime = currentDate.hour(loginHour).minute(loginMinute).second(0).millisecond(0).toDate();

      if (isToday) {
        // Today's active records
        if (emp.name === 'Alex Rivera') {
          // Punched out earlier today
          const logoutTime = currentDate.hour(16).minute(30).second(0).millisecond(0).toDate();
          attendanceDocs.push({
            employee_id: emp._id,
            date: dateStr,
            status: 'Late',
            first_login_time: loginTime,
            last_logout_time: logoutTime,
            activity_logs: [
              { action: 'Login', time: loginTime },
              { action: 'Logout', time: logoutTime },
            ],
          });
        } else if (emp.name === 'David Kim') {
          // Multiple punches today: login 9:05, lunch out 12:30, login 13:15
          const lunchOut = currentDate.hour(12).minute(30).second(0).toDate();
          const lunchIn = currentDate.hour(13).minute(15).second(0).toDate();
          attendanceDocs.push({
            employee_id: emp._id,
            date: dateStr,
            status: 'Present',
            first_login_time: loginTime,
            last_logout_time: lunchOut,
            activity_logs: [
              { action: 'Login', time: loginTime },
              { action: 'Logout', time: lunchOut },
              { action: 'Login', time: lunchIn },
            ],
          });
        } else {
          // Currently In
          attendanceDocs.push({
            employee_id: emp._id,
            date: dateStr,
            status: isLate ? 'Late' : 'Present',
            first_login_time: loginTime,
            activity_logs: [
              { action: 'Login', time: loginTime },
            ],
          });
        }
      } else {
        // Past days: completed shifts with first_login_time and last_logout_time
        const logoutHour = 17 + (hash % 2);
        const logoutMinute = 10 + (hash % 40);
        const logoutTime = currentDate.hour(logoutHour).minute(logoutMinute).second(0).millisecond(0).toDate();

        attendanceDocs.push({
          employee_id: emp._id,
          date: dateStr,
          status: isLate ? 'Late' : 'Present',
          first_login_time: loginTime,
          last_logout_time: logoutTime,
          activity_logs: [
            { action: 'Login', time: loginTime },
            { action: 'Logout', time: logoutTime },
          ],
        });
      }
    }
  }

  console.log(`[Seed] Inserting ${attendanceDocs.length} attendance records across 7 days...`);
  await Attendance.insertMany(attendanceDocs);

  // Ensure indexes are built
  await Attendance.syncIndexes();
  await Employee.syncIndexes();

  console.log('[Seed] Seeding completed successfully.');
  return {
    employeesCount: createdEmployees.length,
    attendanceRecordsCount: attendanceDocs.length,
  };
}

// If executed directly via CLI (tsx server/seed.ts)
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      console.log('[Seed CLI] Done!');
      process.exit(0);
    } catch (e: any) {
      console.error('[Seed CLI] Error:', e);
      process.exit(1);
    }
  })();
}
