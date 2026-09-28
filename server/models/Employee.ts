import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEmployee extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  department: string;
  shift_start: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    name: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      default: '123456',
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    shift_start: {
      type: String,
      default: '09:00 AM',
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'employees',
  }
);

export const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);
