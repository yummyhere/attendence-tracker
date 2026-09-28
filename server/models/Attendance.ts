import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IActivityLog {
  action: 'Login' | 'Logout';
  time: Date;
}

export interface IAttendance extends Document {
  _id: Types.ObjectId;
  employee_id: Types.ObjectId;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Late';
  first_login_time?: Date;
  last_logout_time?: Date;
  activity_logs: IActivityLog[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    action: {
      type: String,
      enum: ['Login', 'Logout'],
      required: true,
    },
    time: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: false }
);

const AttendanceSchema = new Schema<IAttendance>(
  {
    employee_id: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'employee_id reference is required'],
      index: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: [true, 'Attendance date string is required (YYYY-MM-DD)'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'],
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late'],
      required: true,
      default: 'Present',
    },
    first_login_time: {
      type: Date,
    },
    last_logout_time: {
      type: Date,
    },
    activity_logs: {
      type: [ActivityLogSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'attendance',
  }
);

// Core design constraint: One document per employee per day
AttendanceSchema.index({ employee_id: 1, date: 1 }, { unique: true });

// Phase 5 Index: Compound index for fast employee history lookup by descending date
AttendanceSchema.index({ employee_id: 1, date: -1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
