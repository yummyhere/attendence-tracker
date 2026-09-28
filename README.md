# Smart Office Attendance & Activity Tracker

An enterprise-grade Employee Attendance and Activity Tracking System architected with Node.js, Express, MongoDB (Mongoose), and React with Tailwind CSS.

---

## Architecture & Technology Stack

- **Backend:** Node.js, Express.js REST API
- **Database:** MongoDB (Database: `office_management`) via Mongoose ODM
- **Time Handling:** Day.js with shift grace period calculations
- **Frontend:** React 19 (Vite), Tailwind CSS v4, Lucide Icons, Motion
- **Design Philosophy:** Clean enterprise SaaS aesthetic (Linear/Notion inspired), neutral cool grays, single elevation, tabular figures (`font-mono tabular-nums`), zero-pill metadata.

---

## Phase 1 — Database & Schema Design

Database: `office_management`

### 1. `employees` Collection

```typescript
{
  _id: ObjectId,
  name: "Marcus Chen",
  email: "marcus.chen@office.internal", // Unique indexed
  department: "Engineering",
  shift_start: "09:00 AM",
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### 2. `attendance` Collection

```typescript
{
  _id: ObjectId,
  employee_id: ObjectId,             // Ref: Employee
  date: "2026-09-25",                // String YYYY-MM-DD
  status: "Present" | "Absent" | "Late",
  first_login_time: ISODate,
  last_logout_time: ISODate,
  activity_logs: [
    { action: "Login" | "Logout", time: ISODate }
  ],
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### Core Design Constraint: One Document Per Employee Per Day

Enforced at the database engine level via unique compound index:
```javascript
AttendanceSchema.index({ employee_id: 1, date: 1 }, { unique: true });
```
This guarantees zero document duplicates even under concurrent requests or network retries.

---

## Phase 2 — Core Punch Logic (Atomic Upsert)

Endpoint: `POST /api/attendance/punch`

### How the Atomic Upsert Works Without Race Conditions:

Instead of issuing separate `findOne` and `save` operations (which cause race conditions under simultaneous requests), the operation executes a **single atomic Mongoose `findOneAndUpdate`**:

```typescript
const updateDoc = {
  $setOnInsert: {
    employee_id: empObjectId,
    date: todayStr,
    first_login_time: now,
    status: isLate ? 'Late' : 'Present',
  },
  $push: {
    activity_logs: { action, time: now },
  },
};

if (action === 'Logout') {
  updateDoc.$set = { last_logout_time: now };
}

await Attendance.findOneAndUpdate(
  { employee_id: empObjectId, date: todayStr },
  updateDoc,
  { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
);
```

1. **If document does NOT exist for today:**
   - `$setOnInsert` initializes `employee_id`, `date`, `first_login_time`, and sets `status` based on arrival time vs shift start (with a 15-minute grace window).
   - `$push` appends the initial `{ action: 'Login', time: now }` to `activity_logs`.
2. **If document ALREADY exists:**
   - `$setOnInsert` is bypassed entirely by MongoDB.
   - `$push` appends `{ action: 'Logout', time: now }` (or subsequent punch).
   - `$set` updates `last_logout_time` to current timestamp.

---

## Phase 3 — Query Layer

All queries are implemented in `server/services/attendanceService.ts`:

### 1. Employees Marked "Late" Today
Queries records on the target date where `status: 'Late'` (login occurred after shift threshold):
```javascript
Attendance.find({
  date: todayStr,
  status: 'Late',
})
.populate('employee_id')
.sort({ first_login_time: 1 });
```

### 2. Specific Employee Attendance History
Uses `$and` + `$eq` on `employee_id` and date range filters:
```javascript
Attendance.find({
  $and: [
    { employee_id: { $eq: employeeObjectId } },
    { date: { $gte: startDate, $lte: endDate } }
  ]
})
.sort({ date: -1 })
.populate('employee_id');
```

### 3. Filter Attendance by Departments
Uses `$lookup` + `$in` within an aggregation pipeline:
```javascript
Attendance.aggregate([
  { $match: { date: targetDate } },
  {
    $lookup: {
      from: 'employees',
      localField: 'employee_id',
      foreignField: '_id',
      as: 'employee',
    },
  },
  { $unwind: '$employee' },
  {
    $match: {
      'employee.department': { $in: ['Engineering', 'Design'] },
    },
  },
  { $sort: { 'employee.name': 1 } },
]);
```

---

## Phase 4 — Aggregation Pipeline & Manual `mongosh` Execution

### 1. Total Hours Worked

Calculates millisecond difference between `first_login_time` and `last_logout_time` (or current timestamp if actively clocked in) divided by `3,600,000` to convert to hours.

#### Manual `mongosh` Command:
```javascript
use office_management;

db.attendance.aggregate([
  {
    $match: {
      date: "2026-09-25",
      first_login_time: { $exists: true }
    }
  },
  {
    $project: {
      employee_id: 1,
      date: 1,
      status: 1,
      first_login_time: 1,
      last_logout_time: 1,
      total_hours: {
        $cond: {
          if: { $and: ["$first_login_time", "$last_logout_time"] },
          then: {
            $round: [
              {
                $divide: [
                  { $subtract: ["$last_logout_time", "$first_login_time"] },
                  3600000
                ]
              },
              2
            ]
          },
          else: {
            $round: [
              {
                $divide: [
                  { $subtract: ["$$NOW", "$first_login_time"] },
                  3600000
                ]
              },
              2
            ]
          }
        }
      }
    }
  },
  {
    $lookup: {
      from: "employees",
      localField: "employee_id",
      foreignField: "_id",
      as: "employee"
    }
  },
  { $unwind: "$employee" },
  { $sort: { total_hours: -1 } }
]);
```

### 2. Monthly Summary Report

Groups by `employee_id` and `status` to count Present, Late, and Absent days per employee for the target month.

#### Manual `mongosh` Command:
```javascript
use office_management;

db.attendance.aggregate([
  {
    $match: {
      date: { $regex: /^2026-09/ }
    }
  },
  {
    $group: {
      _id: {
        employee_id: "$employee_id",
        status: "$status"
      },
      count: { $sum: 1 }
    }
  },
  {
    $group: {
      _id: "$_id.employee_id",
      statusCounts: {
        $push: {
          status: "$_id.status",
          count: "$count"
        }
      },
      totalLoggedDays: { $sum: "$count" }
    }
  },
  {
    $lookup: {
      from: "employees",
      localField: "_id",
      foreignField: "_id",
      as: "employee"
    }
  },
  { $unwind: "$employee" },
  {
    $project: {
      _id: 0,
      employee_id: "$_id",
      name: "$employee.name",
      email: "$employee.email",
      department: "$employee.department",
      present_days: {
        $reduce: {
          input: "$statusCounts",
          initialValue: 0,
          in: {
            $cond: [{ $eq: ["$$this.status", "Present"] }, "$$this.count", "$$value"]
          }
        }
      },
      late_days: {
        $reduce: {
          input: "$statusCounts",
          initialValue: 0,
          in: {
            $cond: [{ $eq: ["$$this.status", "Late"] }, "$$this.count", "$$value"]
          }
        }
      },
      absent_days: {
        $reduce: {
          input: "$statusCounts",
          initialValue: 0,
          in: {
            $cond: [{ $eq: ["$$this.status", "Absent"] }, "$$this.count", "$$value"]
          }
        }
      },
      total_logged_days: "$totalLoggedDays"
    }
  },
  { $sort: { name: 1 } }
]);
```

---

## Phase 5 — Indexing & Performance Comparison

Compound Index:
```javascript
db.attendance.createIndex({ employee_id: 1, date: -1 });
```

### Execution Stats Comparison (`.explain("executionStats")`)

Query evaluated:
```javascript
db.attendance.find({
  employee_id: ObjectId("68d4ea54751f71a0fd7aa101"),
  date: { $gte: "2026-09-01", $lte: "2026-09-30" }
})
```

#### 1. WITHOUT Index (Forced Collection Scan via `.hint({ $natural: 1 })`):
```json
{
  "executionStats": {
    "executionSuccess": true,
    "nReturned": 7,
    "executionTimeMillis": 4,
    "totalKeysExamined": 0,
    "totalDocsExamined": 65,
    "executionStages": {
      "stage": "COLLSCAN",
      "filter": {
        "$and": [
          { "employee_id": { "$eq": "68d4ea54751f71a0fd7aa101" } },
          { "date": { "$gte": "2026-09-01" } },
          { "date": { "$lte": "2026-09-30" } }
        ]
      },
      "nReturned": 7,
      "docsExamined": 65
    }
  }
}
```

#### 2. WITH Compound Index `{ employee_id: 1, date: -1 }`:
```json
{
  "executionStats": {
    "executionSuccess": true,
    "nReturned": 7,
    "executionTimeMillis": 0,
    "totalKeysExamined": 7,
    "totalDocsExamined": 7,
    "executionStages": {
      "stage": "FETCH",
      "nReturned": 7,
      "docsExamined": 7,
      "inputStage": {
        "stage": "IXSCAN",
        "keyPattern": { "employee_id": 1, "date": -1 },
        "indexName": "employee_id_1_date_-1",
        "keysExamined": 7
      }
    }
  }
}
```

### Written Performance Analysis:
- **`totalDocsExamined` Reduction:** The compound index reduced document reads from **65 docs** (entire collection table scan `COLLSCAN`) down to **7 docs** (`totalDocsExamined: 7`), yielding an exact 1:1 ratio between inspected documents and returned rows.
- **`totalKeysExamined`:** In the index scan, MongoDB navigated B-Tree index pointers directly (`keysExamined: 7`), bypassing irrelevant documents for other employees.
- **Execution Time:** Reduced from ~4ms (scales linearly $O(N)$ with collection size) down to ~0ms ($O(\log N)$ B-Tree lookup + bound scan).

---

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
   (Runs Express backend on `http://localhost:3000` with embedded MongoDB and Vite middlewares mounted).
3. Optional custom MongoDB URI:
   Set `MONGODB_URI="mongodb://localhost:27017/office_management"` in `.env`.
