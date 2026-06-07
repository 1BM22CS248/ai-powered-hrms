import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { sql, eq } from 'drizzle-orm'
import { db } from './client'
import { employees, attendance, leaveBalance, leaveRequests, payroll, onboardingTasks } from './schema'
import type { NewEmployee } from './schema'

// ---------------------------------------------------------------------------
// Deterministic seeded LCG — re-runs produce identical data
// ---------------------------------------------------------------------------
let _seed = 42
function rand(): number {
  _seed = (_seed * 1664525 + 1013904223) & 0x7fffffff
  return _seed / 0x7fffffff
}
function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min
}

// ---------------------------------------------------------------------------
// Employee definitions — 50 employees across 6 departments
// ---------------------------------------------------------------------------
interface EmpDef {
  empCode: string
  name: string
  email: string
  role: 'admin' | 'hr' | 'manager' | 'employee'
  department: string
  designation: string
  salary: string          // annual INR
  joiningDate: string
  phone: string
  isManager?: boolean     // dept head flag
}

const EMPLOYEES: EmpDef[] = [
  // EMP000 Super Admin
  { empCode:'EMP000', name:'Suresh Menon',      email:'admin@hrms.com',            role:'admin',    department:'HR',          designation:'Super Admin',              salary:'2400000', joiningDate:'2020-01-01', phone:'9800000000' },

  // HR (5)
  { empCode:'EMP001', name:'Priya Nair',         email:'priya.nair@hrms.com',       role:'hr',       department:'HR',          designation:'HR Director',              salary:'2000000', joiningDate:'2020-03-01', phone:'9800000001', isManager:true  },
  { empCode:'EMP002', name:'Ravi Kumar',          email:'ravi.kumar@hrms.com',       role:'hr',       department:'HR',          designation:'HR Manager',               salary:'1400000', joiningDate:'2021-06-15', phone:'9800000002' },
  { empCode:'EMP003', name:'Neha Pillai',         email:'neha.pillai@hrms.com',      role:'employee', department:'HR',          designation:'HR Executive',             salary: '700000', joiningDate:'2022-02-01', phone:'9800000003' },
  { empCode:'EMP004', name:'Suresh Patel',        email:'suresh.patel@hrms.com',     role:'employee', department:'HR',          designation:'HR Executive',             salary: '650000', joiningDate:'2022-08-10', phone:'9800000004' },
  { empCode:'EMP005', name:'Anita Desai',         email:'anita.desai@hrms.com',      role:'employee', department:'HR',          designation:'HR Executive',             salary: '620000', joiningDate:'2023-01-05', phone:'9800000005' },

  // Engineering (15)
  { empCode:'EMP006', name:'Arjun Mehta',         email:'arjun.mehta@hrms.com',      role:'manager',  department:'Engineering', designation:'VP Engineering',           salary:'4200000', joiningDate:'2020-02-01', phone:'9800000006', isManager:true  },
  { empCode:'EMP007', name:'Deepak Tiwari',       email:'deepak.tiwari@hrms.com',    role:'employee', department:'Engineering', designation:'Principal Engineer',       salary:'3500000', joiningDate:'2020-06-01', phone:'9800000007' },
  { empCode:'EMP008', name:'Smita Rao',           email:'smita.rao@hrms.com',        role:'employee', department:'Engineering', designation:'Lead Engineer',            salary:'2800000', joiningDate:'2021-03-15', phone:'9800000008' },
  { empCode:'EMP009', name:'Ritika Jain',         email:'ritika.jain@hrms.com',      role:'employee', department:'Engineering', designation:'Senior SDE',               salary:'2200000', joiningDate:'2021-07-01', phone:'9800000009' },
  { empCode:'EMP010', name:'Rohan Shah',          email:'rohan.shah@hrms.com',       role:'employee', department:'Engineering', designation:'Senior SDE',               salary:'2100000', joiningDate:'2021-09-15', phone:'9800000010' },
  { empCode:'EMP011', name:'Amit Sharma',         email:'amit.sharma@hrms.com',      role:'employee', department:'Engineering', designation:'SDE III',                  salary:'1700000', joiningDate:'2022-01-10', phone:'9800000011' },
  { empCode:'EMP012', name:'Kavya Reddy',         email:'kavya.reddy@hrms.com',      role:'employee', department:'Engineering', designation:'SDE III',                  salary:'1650000', joiningDate:'2022-04-01', phone:'9800000012' },
  { empCode:'EMP013', name:'Vikram Rao',          email:'vikram.rao@hrms.com',       role:'employee', department:'Engineering', designation:'SDE II',                   salary:'1200000', joiningDate:'2022-09-01', phone:'9800000013' },
  { empCode:'EMP014', name:'Preeti Shah',         email:'preeti.shah@hrms.com',      role:'employee', department:'Engineering', designation:'SDE II',                   salary:'1150000', joiningDate:'2023-01-15', phone:'9800000014' },
  { empCode:'EMP015', name:'Ayush Bansal',        email:'ayush.bansal@hrms.com',     role:'employee', department:'Engineering', designation:'SDE II',                   salary:'1100000', joiningDate:'2023-04-01', phone:'9800000015' },
  { empCode:'EMP016', name:'Ananya Das',          email:'ananya.das@hrms.com',       role:'employee', department:'Engineering', designation:'SDE I',                    salary: '850000', joiningDate:'2023-08-01', phone:'9800000016' },
  { empCode:'EMP017', name:'Mansi Joshi',         email:'mansi.joshi@hrms.com',      role:'employee', department:'Engineering', designation:'SDE I',                    salary: '800000', joiningDate:'2023-10-15', phone:'9800000017' },
  { empCode:'EMP018', name:'Nandini Iyer',        email:'nandini.iyer@hrms.com',     role:'employee', department:'Engineering', designation:'SDE I',                    salary: '780000', joiningDate:'2024-01-08', phone:'9800000018' },
  { empCode:'EMP019', name:'Siddharth Roy',       email:'siddharth.roy@hrms.com',    role:'employee', department:'Engineering', designation:'SDE I',                    salary: '750000', joiningDate:'2024-03-01', phone:'9800000019' },
  { empCode:'EMP020', name:'Pooja Singh',         email:'pooja.singh@hrms.com',      role:'employee', department:'Engineering', designation:'SDE I',                    salary: '720000', joiningDate:'2024-06-01', phone:'9800000020' },

  // Finance (7)
  { empCode:'EMP021', name:'Karthik Iyer',        email:'karthik.iyer@hrms.com',     role:'manager',  department:'Finance',     designation:'CFO',                      salary:'3000000', joiningDate:'2020-04-01', phone:'9800000021', isManager:true  },
  { empCode:'EMP022', name:'Meera Joshi',         email:'meera.joshi@hrms.com',      role:'employee', department:'Finance',     designation:'Finance Manager',          salary:'1800000', joiningDate:'2021-01-15', phone:'9800000022' },
  { empCode:'EMP023', name:'Manoj Kumar',         email:'manoj.kumar@hrms.com',      role:'employee', department:'Finance',     designation:'Finance Manager',          salary:'1750000', joiningDate:'2021-05-01', phone:'9800000023' },
  { empCode:'EMP024', name:'Anjali Mishra',       email:'anjali.mishra@hrms.com',    role:'employee', department:'Finance',     designation:'Senior Finance Analyst',   salary:'1100000', joiningDate:'2022-03-10', phone:'9800000024' },
  { empCode:'EMP025', name:'Rahul Verma',         email:'rahul.verma@hrms.com',      role:'employee', department:'Finance',     designation:'Finance Analyst',          salary: '850000', joiningDate:'2022-11-01', phone:'9800000025' },
  { empCode:'EMP026', name:'Rinku Das',           email:'rinku.das@hrms.com',        role:'employee', department:'Finance',     designation:'Accountant',               salary: '700000', joiningDate:'2023-06-01', phone:'9800000026' },
  { empCode:'EMP027', name:'Mohit Yadav',         email:'mohit.yadav@hrms.com',      role:'employee', department:'Finance',     designation:'Accountant',               salary: '680000', joiningDate:'2024-01-10', phone:'9800000027' },

  // Product (8)
  { empCode:'EMP028', name:'Divya Pillai',        email:'divya.pillai@hrms.com',     role:'manager',  department:'Product',     designation:'VP Product',               salary:'3800000', joiningDate:'2020-05-01', phone:'9800000028', isManager:true  },
  { empCode:'EMP029', name:'Sachin Malhotra',     email:'sachin.malhotra@hrms.com',  role:'employee', department:'Product',     designation:'Group Product Manager',    salary:'2400000', joiningDate:'2021-02-15', phone:'9800000029' },
  { empCode:'EMP030', name:'Isha Kapoor',         email:'isha.kapoor@hrms.com',      role:'employee', department:'Product',     designation:'Senior Product Manager',   salary:'2100000', joiningDate:'2021-07-01', phone:'9800000030' },
  { empCode:'EMP031', name:'Aditya Sharma',       email:'aditya.sharma@hrms.com',    role:'employee', department:'Product',     designation:'Product Manager',          salary:'1600000', joiningDate:'2022-02-01', phone:'9800000031' },
  { empCode:'EMP032', name:'Simran Kaur',         email:'simran.kaur@hrms.com',      role:'employee', department:'Product',     designation:'Product Manager',          salary:'1550000', joiningDate:'2022-07-01', phone:'9800000032' },
  { empCode:'EMP033', name:'Rajeev Pillai',       email:'rajeev.pillai@hrms.com',    role:'employee', department:'Product',     designation:'Associate Product Manager', salary:'1100000', joiningDate:'2023-03-01', phone:'9800000033' },
  { empCode:'EMP034', name:'Tanya Mehta',         email:'tanya.mehta@hrms.com',      role:'employee', department:'Product',     designation:'Associate Product Manager', salary:'1050000', joiningDate:'2023-08-15', phone:'9800000034' },
  { empCode:'EMP035', name:'Pavan Reddy',         email:'pavan.reddy@hrms.com',      role:'employee', department:'Product',     designation:'Product Analyst',          salary: '850000', joiningDate:'2024-02-01', phone:'9800000035' },

  // Sales (8)
  { empCode:'EMP036', name:'Varun Sinha',         email:'varun.sinha@hrms.com',      role:'manager',  department:'Sales',       designation:'VP Sales',                 salary:'2500000', joiningDate:'2020-06-01', phone:'9800000036', isManager:true  },
  { empCode:'EMP037', name:'Pallavi Desai',       email:'pallavi.desai@hrms.com',    role:'employee', department:'Sales',       designation:'Sales Manager',            salary:'1600000', joiningDate:'2021-03-01', phone:'9800000037' },
  { empCode:'EMP038', name:'Tushar Patil',        email:'tushar.patil@hrms.com',     role:'employee', department:'Sales',       designation:'Sales Manager',            salary:'1550000', joiningDate:'2021-09-01', phone:'9800000038' },
  { empCode:'EMP039', name:'Arun Nair',           email:'arun.nair@hrms.com',        role:'employee', department:'Sales',       designation:'Key Account Manager',      salary:'1200000', joiningDate:'2022-04-01', phone:'9800000039' },
  { empCode:'EMP040', name:'Bhavna Singh',        email:'bhavna.singh@hrms.com',     role:'employee', department:'Sales',       designation:'Senior Sales Executive',   salary: '900000', joiningDate:'2022-10-01', phone:'9800000040' },
  { empCode:'EMP041', name:'Pawan Kumar',         email:'pawan.kumar@hrms.com',      role:'employee', department:'Sales',       designation:'Sales Executive',          salary: '720000', joiningDate:'2023-04-01', phone:'9800000041' },
  { empCode:'EMP042', name:'Lakshmi Menon',       email:'lakshmi.menon@hrms.com',    role:'employee', department:'Sales',       designation:'Sales Executive',          salary: '680000', joiningDate:'2023-09-01', phone:'9800000042' },
  { empCode:'EMP043', name:'Dhruv Saxena',        email:'dhruv.saxena@hrms.com',     role:'employee', department:'Sales',       designation:'Sales Analyst',            salary: '620000', joiningDate:'2024-01-15', phone:'9800000043' },

  // Admin (7)
  { empCode:'EMP044', name:'Sneha Reddy',         email:'sneha.reddy@hrms.com',      role:'manager',  department:'Admin',       designation:'Admin Head',               salary:'1200000', joiningDate:'2020-07-01', phone:'9800000044', isManager:true  },
  { empCode:'EMP045', name:'Gaurav Bhatt',        email:'gaurav.bhatt@hrms.com',     role:'employee', department:'Admin',       designation:'Office Manager',           salary: '900000', joiningDate:'2021-02-01', phone:'9800000045' },
  { empCode:'EMP046', name:'Shruti Nair',         email:'shruti.nair@hrms.com',      role:'employee', department:'Admin',       designation:'IT Administrator',         salary: '850000', joiningDate:'2021-08-15', phone:'9800000046' },
  { empCode:'EMP047', name:'Abhishek Gupta',      email:'abhishek.gupta@hrms.com',   role:'employee', department:'Admin',       designation:'Executive Assistant',      salary: '700000', joiningDate:'2022-05-01', phone:'9800000047' },
  { empCode:'EMP048', name:'Shweta Agarwal',      email:'shweta.agarwal@hrms.com',   role:'employee', department:'Admin',       designation:'Admin Executive',          salary: '620000', joiningDate:'2022-11-01', phone:'9800000048' },
  { empCode:'EMP049', name:'Lokesh Kumar',        email:'lokesh.kumar@hrms.com',     role:'employee', department:'Admin',       designation:'Facility Manager',         salary: '780000', joiningDate:'2023-03-15', phone:'9800000049' },
  { empCode:'EMP050', name:'Kunal Verma',         email:'kunal.verma@hrms.com',      role:'employee', department:'Admin',       designation:'Admin Executive',          salary: '580000', joiningDate:'2024-02-01', phone:'9800000050' },

  // ── Harsh (3 roles for demo/testing) ─────────────────────────────────────
  { empCode:'EMP051', name:'Harsh Singh',         email:'harsh.admin@hrms.com',      role:'admin',    department:'HR',          designation:'System Administrator',     salary:'2400000', joiningDate:'2020-01-15', phone:'9900000051' },
  { empCode:'EMP052', name:'Harsh Mehta',         email:'harsh.hr@hrms.com',         role:'hr',       department:'HR',          designation:'HR Specialist',            salary:'1200000', joiningDate:'2022-03-01', phone:'9900000052' },
  { empCode:'EMP053', name:'Harsh Kumar',         email:'harsh@hrms.com',            role:'employee', department:'Engineering', designation:'Software Engineer',         salary: '900000', joiningDate:'2023-06-15', phone:'9900000053' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function toTsStr(d: Date): string {
  // Format: YYYY-MM-DD HH:MM:SS (PostgreSQL-compatible)
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

function isWeekend(d: Date): boolean {
  const day = d.getDay()
  return day === 0 || day === 6
}

function monthDays(year: number, month: number): Date[] {
  const days: Date[] = []
  const d = new Date(year, month - 1, 1)
  while (d.getMonth() === month - 1) {
    days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const BATCH = 500

  console.log('Wiping existing data (FK-safe order)…')
  await db.execute(sql`DELETE FROM payroll`)
  await db.execute(sql`DELETE FROM leave_requests`)
  await db.execute(sql`DELETE FROM leave_balance`)
  await db.execute(sql`DELETE FROM attendance`)
  await db.execute(sql`DELETE FROM onboarding_tasks`)
  await db.execute(sql`DELETE FROM employees`)

  // ── 1. Employees ──────────────────────────────────────────────────────────
  console.log('Hashing password…')
  const hash = await bcrypt.hash('Password@123', 10)

  console.log('Inserting 50 employees…')
  // A handful of employees are on approved leave during the seeded period
  const ON_LEAVE_CODES = new Set(['EMP013', 'EMP022', 'EMP033'])

  const insertVals: NewEmployee[] = EMPLOYEES.map(e => ({
    empCode:     e.empCode,
    name:        e.name,
    email:       e.email,
    password:    hash,
    phone:       e.phone,
    role:        e.role,
    department:  e.department,
    designation: e.designation,
    salary:      e.salary,
    joiningDate: e.joiningDate,
    status:      ON_LEAVE_CODES.has(e.empCode) ? 'on-leave' as const : 'active' as const,
  }))

  const insertedRows = await db.insert(employees).values(insertVals)
    .returning({ id: employees.id, empCode: employees.empCode })

  console.log(`✓ ${insertedRows.length} employees`)

  const codeToId: Record<string, string> = {}
  for (const row of insertedRows) {
    codeToId[row.empCode] = row.id
  }

  // Department head map
  const deptManagerId: Record<string, string> = {}
  for (const e of EMPLOYEES) {
    if (e.isManager) {
      deptManagerId[e.department] = codeToId[e.empCode]
    }
  }

  // Wire managerId
  for (const e of EMPLOYEES) {
    if (!e.isManager && e.role !== 'admin') {
      const mgr = deptManagerId[e.department]
      if (mgr) {
        await db.update(employees).set({ managerId: mgr }).where(eq(employees.empCode, e.empCode))
      }
    }
  }
  console.log('✓ managerId wired')

  // ── 2. Attendance — March, April, May 2026 ──────────────────────────────
  console.log('Building attendance records…')

  type AttStatus = 'present' | 'wfh' | 'absent' | 'half_day' | 'weekend'
  interface AttCache { empCode: string; date: string; status: AttStatus }

  const attCache: AttCache[] = []

  type AttInsert = typeof attendance.$inferInsert
  const attBatch: AttInsert[] = []

  const attMonths = [
    { year: 2026, month: 3 },
    { year: 2026, month: 4 },
    { year: 2026, month: 5 },
  ]

  for (const emp of EMPLOYEES) {
    const empId = codeToId[emp.empCode]
    for (const { year, month } of attMonths) {
      for (const day of monthDays(year, month)) {
        const dateStr = toDateStr(day)

        if (isWeekend(day)) {
          attBatch.push({ employeeId: empId, date: dateStr, status: 'weekend' })
          attCache.push({ empCode: emp.empCode, date: dateStr, status: 'weekend' })
          continue
        }

        const r = rand()
        let status: AttStatus
        if (r < 0.82)      status = 'present'
        else if (r < 0.90) status = 'wfh'
        else if (r < 0.96) status = 'absent'
        else               status = 'half_day'

        attCache.push({ empCode: emp.empCode, date: dateStr, status })

        if (status === 'absent') {
          attBatch.push({ employeeId: empId, date: dateStr, status: 'absent' })
          continue
        }

        const ciHour = rand() < 0.6 ? 8 : 9
        const ciMin  = randInt(30, 59)
        const checkIn  = new Date(year, month - 1, day.getDate(), ciHour, ciMin)
        const durH     = status === 'half_day' ? 4 : 8 + rand() * 2
        const checkOut = new Date(checkIn.getTime() + durH * 3_600_000)

        attBatch.push({
          employeeId:  empId,
          date:        dateStr,
          status,
          checkIn,
          checkOut,
          hoursWorked: durH.toFixed(2),
        })
      }
    }
  }

  for (let i = 0; i < attBatch.length; i += BATCH) {
    await db.insert(attendance).values(attBatch.slice(i, i + BATCH))
  }
  console.log(`✓ ${attBatch.length} attendance records`)

  // ── 3. Leave balances ────────────────────────────────────────────────────
  console.log('Inserting leave balances…')
  type LBInsert = typeof leaveBalance.$inferInsert
  const lbRows: LBInsert[] = insertedRows.map((row, idx) => ({
    employeeId: row.id,
    year:       '2026',
    casual:     '12',
    sick:       '10',
    earned:     '15',
    used:       String(idx % 4),
  }))
  await db.insert(leaveBalance).values(lbRows)
  console.log(`✓ ${lbRows.length} leave balances`)

  // ── 4. Leave requests (20) ───────────────────────────────────────────────
  console.log('Inserting leave requests…')

  type LRInsert = typeof leaveRequests.$inferInsert
  interface LeaveDef {
    empCode: string
    type: 'casual' | 'sick' | 'earned' | 'maternity' | 'unpaid'
    start: string; end: string; days: string; reason: string
    status: 'pending' | 'approved' | 'rejected' | 'cancelled'
    approverCode?: string; note?: string
  }

  const leaveDefs: LeaveDef[] = [
    { empCode:'EMP008', type:'casual',   start:'2026-03-10', end:'2026-03-11', days:'2', reason:'Personal work and family obligation',          status:'approved', approverCode:'EMP006', note:'Approved' },
    { empCode:'EMP013', type:'sick',     start:'2026-03-17', end:'2026-03-19', days:'3', reason:'Fever and viral infection, doctor advised rest', status:'approved', approverCode:'EMP006', note:'Get well soon' },
    { empCode:'EMP025', type:'casual',   start:'2026-03-24', end:'2026-03-24', days:'1', reason:'Bank work and personal errand',                  status:'approved', approverCode:'EMP021', note:'Approved' },
    { empCode:'EMP031', type:'earned',   start:'2026-03-27', end:'2026-03-28', days:'2', reason:'Family function and travel',                     status:'approved', approverCode:'EMP028', note:'Enjoy' },
    { empCode:'EMP039', type:'casual',   start:'2026-03-05', end:'2026-03-05', days:'1', reason:'Vehicle registration renewal appointment',       status:'approved', approverCode:'EMP036', note:'Approved' },
    { empCode:'EMP046', type:'sick',     start:'2026-03-20', end:'2026-03-21', days:'2', reason:'Migraine and vertigo, unable to attend',         status:'approved', approverCode:'EMP044', note:'Rest well' },
    { empCode:'EMP011', type:'casual',   start:'2026-04-07', end:'2026-04-08', days:'2', reason:'Home renovation and shifting',                   status:'approved', approverCode:'EMP006', note:'Approved' },
    { empCode:'EMP022', type:'earned',   start:'2026-04-14', end:'2026-04-17', days:'4', reason:'Annual vacation with family',                    status:'approved', approverCode:'EMP021', note:'Have fun' },
    { empCode:'EMP033', type:'sick',     start:'2026-04-02', end:'2026-04-02', days:'1', reason:'Dental procedure, dentist advised rest',         status:'approved', approverCode:'EMP028', note:'Approved' },
    { empCode:'EMP040', type:'casual',   start:'2026-04-22', end:'2026-04-22', days:'1', reason:'School admission for child',                     status:'approved', approverCode:'EMP036', note:'Approved' },
    { empCode:'EMP009', type:'sick',     start:'2026-05-06', end:'2026-05-07', days:'2', reason:'Food poisoning, doctor visit required',          status:'pending' },
    { empCode:'EMP016', type:'casual',   start:'2026-05-12', end:'2026-05-12', days:'1', reason:'Court appearance for property matter',           status:'pending' },
    { empCode:'EMP027', type:'earned',   start:'2026-05-19', end:'2026-05-22', days:'4', reason:'Wedding anniversary trip with family',           status:'pending' },
    { empCode:'EMP034', type:'casual',   start:'2026-05-08', end:'2026-05-08', days:'1', reason:'Car servicing and insurance renewal',            status:'pending' },
    { empCode:'EMP041', type:'sick',     start:'2026-05-15', end:'2026-05-16', days:'2', reason:'Back pain and physiotherapy session',            status:'pending' },
    { empCode:'EMP047', type:'casual',   start:'2026-05-26', end:'2026-05-27', days:'2', reason:'Out-of-town family event',                       status:'pending' },
    { empCode:'EMP010', type:'casual',   start:'2026-03-13', end:'2026-03-13', days:'1', reason:'Medical consultation for chronic condition',     status:'rejected', approverCode:'EMP006', note:'Apply sick leave instead' },
    { empCode:'EMP019', type:'earned',   start:'2026-04-01', end:'2026-04-04', days:'4', reason:'Tourism trip planned long back',                 status:'rejected', approverCode:'EMP006', note:'Critical sprint, please reschedule' },
    { empCode:'EMP026', type:'unpaid',   start:'2026-03-03', end:'2026-03-07', days:'5', reason:'Extended family emergency out of town',          status:'rejected', approverCode:'EMP021', note:'Cannot approve during Q1 close' },
    { empCode:'EMP045', type:'casual',   start:'2026-04-29', end:'2026-04-29', days:'1', reason:'Government document submission deadline',        status:'rejected', approverCode:'EMP044', note:'Office event, please reschedule' },
  ]

  const lrRows: LRInsert[] = leaveDefs.map(l => ({
    employeeId:   codeToId[l.empCode],
    type:         l.type,
    startDate:    l.start,
    endDate:      l.end,
    days:         l.days,
    reason:       l.reason,
    status:       l.status,
    approvedBy:   l.approverCode ? codeToId[l.approverCode] : undefined,
    approverNote: l.note,
  }))
  await db.insert(leaveRequests).values(lrRows)
  console.log(`✓ ${lrRows.length} leave requests`)

  // ── 5. Payroll — April 2026 (paid) + May 2026 (approved) ─────────────────
  console.log('Building payroll records…')

  type PayInsert = typeof payroll.$inferInsert

  function absentCount(empCode: string, monthPrefix: string): number {
    return attCache.filter(r => r.empCode === empCode && r.date.startsWith(monthPrefix) && r.status === 'absent').length
  }

  const payMonths: { month: string; status: 'paid' | 'approved' }[] = [
    { month: '2026-04', status: 'paid'     },
    { month: '2026-05', status: 'approved' },
  ]
  const adminId = codeToId['EMP000']
  const payBatch: PayInsert[] = []

  for (const emp of EMPLOYEES) {
    const empId     = codeToId[emp.empCode]
    const annual    = Number(emp.salary)
    const basic     = annual / 12
    const hra       = basic * 0.40
    const pf        = basic * 0.12
    const tds       = annual > 1_500_000 ? basic * 0.20 : annual > 700_000 ? basic * 0.10 : 0

    for (const { month, status } of payMonths) {
      const absent   = absentCount(emp.empCode, month)
      const present  = 22 - absent
      const lop      = absent * (basic / 22)
      const net      = basic + hra - pf - tds - lop

      payBatch.push({
        employeeId:   empId,
        month,
        workingDays:  '22',
        presentDays:  String(present),
        basicSalary:  basic.toFixed(2),
        hra:          hra.toFixed(2),
        bonuses:      '0',
        pfDeduction:  pf.toFixed(2),
        tdsDeduction: tds.toFixed(2),
        lossOfPay:    lop.toFixed(2),
        netPay:       net.toFixed(2),
        status,
        generatedBy:  adminId,
      })
    }
  }

  for (let i = 0; i < payBatch.length; i += BATCH) {
    await db.insert(payroll).values(payBatch.slice(i, i + BATCH))
  }
  console.log(`✓ ${payBatch.length} payroll records`)

  // ── 6. Onboarding tasks — seed for 2024 joiners so admin view shows data ──
  console.log('Seeding onboarding tasks for recent joiners…')

  type OBCategory = 'documents' | 'setup' | 'training' | 'introduction'
  const OB_DEFAULTS: { title: string; description: string; category: OBCategory; dayOffset: number }[] = [
    { title: 'Sign employment contract',    description: 'Review and sign your employment agreement with HR.',                               category: 'documents',    dayOffset: 1 },
    { title: 'Submit identity proof',       description: 'Upload a valid government-issued ID (Aadhaar, Passport, or Driving Licence).',     category: 'documents',    dayOffset: 3 },
    { title: 'Submit address proof',        description: 'Upload a utility bill, bank statement, or rental agreement as address proof.',      category: 'documents',    dayOffset: 3 },
    { title: 'Set up work email',           description: 'Configure your official email account on all work devices.',                        category: 'setup',        dayOffset: 1 },
    { title: 'Complete HRMS profile',       description: 'Fill in all your personal and professional details on this portal.',                category: 'setup',        dayOffset: 2 },
    { title: 'Meet your manager',           description: 'Schedule and attend a one-on-one introductory meeting with your reporting manager.', category: 'introduction', dayOffset: 2 },
    { title: 'Meet your team',             description: 'Attend a team introduction session and connect with your colleagues.',               category: 'introduction', dayOffset: 3 },
    { title: 'Complete HR orientation',     description: 'Watch the company orientation video and complete the accompanying quiz.',           category: 'training',     dayOffset: 7 },
    { title: 'Review company policies',     description: 'Read the employee handbook and acknowledge the code of conduct.',                   category: 'training',     dayOffset: 7 },
  ]

  function obDueDate(joiningDate: string | null, offset: number): string {
    const d = joiningDate ? new Date(joiningDate) : new Date()
    d.setDate(d.getDate() + offset)
    return d.toISOString().split('T')[0]
  }

  // Employees who joined in 2024 — most likely to still be onboarding
  const recentCodes = ['EMP018', 'EMP019', 'EMP020', 'EMP027', 'EMP035', 'EMP043', 'EMP050']
  // Also include a few 2023 joiners so the list is richer
  const moreCodes   = ['EMP016', 'EMP017', 'EMP033', 'EMP034', 'EMP041', 'EMP042', 'EMP047', 'EMP048', 'EMP049']
  const obCodes     = [...recentCodes, ...moreCodes]

  type OBInsert = typeof onboardingTasks.$inferInsert
  const obBatch: OBInsert[] = []

  for (const code of obCodes) {
    const empId = codeToId[code]
    if (!empId) continue
    const empDef   = EMPLOYEES.find(e => e.empCode === code)
    const joinDate = empDef?.joiningDate ?? null

    // 2024 joiners: leave a couple tasks incomplete to show "in progress"
    const is2024 = empDef?.joiningDate?.startsWith('2024') ?? false

    OB_DEFAULTS.forEach((t, idx) => {
      obBatch.push({
        employeeId:  empId,
        title:       t.title,
        description: t.description,
        category:    t.category,
        dueDate:     obDueDate(joinDate, t.dayOffset),
        // 2024 joiners: first 5 tasks completed; rest pending
        // 2023 joiners: all tasks completed
        completed:   is2024 ? idx < 5 : true,
        completedAt: (is2024 ? idx < 5 : true) ? new Date() : null,
      })
    })
  }

  await db.insert(onboardingTasks).values(obBatch)
  console.log(`✓ ${obBatch.length} onboarding tasks (${obCodes.length} employees)`)

  // ── 8. DB indexes ─────────────────────────────────────────────────────────
  console.log('Creating indexes…')
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_attendance_emp    ON attendance(employee_id)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_attendance_date   ON attendance(date)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_leave_req_emp     ON leave_requests(employee_id)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_leave_req_status  ON leave_requests(status)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_payroll_emp_month ON payroll(employee_id, month)`)
  console.log('✓ 5 indexes')

  console.log('\n🌱 Seed complete!')
  process.exit(0)
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
