import 'dotenv/config'
import request from 'supertest'
import app from '../../src/app'
import { cleanDb, seedEmployee } from '../helpers/seed'
import { signToken } from '../../src/utils/jwt'
import { db } from '../../src/db/client'
import { leaveBalance } from '../../src/db/schema'
import { eq, and } from 'drizzle-orm'
import '../helpers/setup'

beforeEach(async () => { await cleanDb() })

function tokenFor(emp: { id: string; email: string; role: string; empCode: string }) {
  return signToken({ id: emp.id, email: emp.email, role: emp.role, empCode: emp.empCode })
}

describe('Leave', () => {
  it('POST /api/leave returns 201 with status=pending', async () => {
    const emp = await seedEmployee({ empCode: 'LV001' })
    const res = await request(app).post('/api/leave')
      .set('Authorization', `Bearer ${tokenFor(emp)}`)
      .send({ type: 'casual', startDate: '2026-07-07', endDate: '2026-07-09', reason: 'Personal work to attend' })
    expect(res.status).toBe(201)
    expect(res.body.data.status).toBe('pending')
  })

  it('PUT /api/leave/:id returns 200 with status=approved when hr approves', async () => {
    const emp = await seedEmployee({ empCode: 'LV002' })
    const hr  = await seedEmployee({ role: 'hr', empCode: 'HR001' })

    const applyRes = await request(app).post('/api/leave')
      .set('Authorization', `Bearer ${tokenFor(emp)}`)
      .send({ type: 'casual', startDate: '2026-07-07', endDate: '2026-07-09', reason: 'Personal work to attend' })
    const leaveId = applyRes.body.data.id

    const approveRes = await request(app).put(`/api/leave/${leaveId}`)
      .set('Authorization', `Bearer ${tokenFor(hr)}`)
      .send({ status: 'approved', approverNote: 'Approved' })

    expect(approveRes.status).toBe(200)
    expect(approveRes.body.data.status).toBe('approved')
  })

  it('POST /api/leave returns 400 when casual balance is exhausted', async () => {
    const emp  = await seedEmployee({ empCode: 'LV003' })
    const year = new Date().getFullYear().toString()

    await db.update(leaveBalance)
      .set({ casual: '0' })
      .where(and(eq(leaveBalance.employeeId, emp.id), eq(leaveBalance.year, year)))

    const res = await request(app).post('/api/leave')
      .set('Authorization', `Bearer ${tokenFor(emp)}`)
      .send({ type: 'casual', startDate: '2026-07-07', endDate: '2026-07-09', reason: 'Personal work to attend' })

    expect(res.status).toBe(400)
  })
})
