import 'dotenv/config'
import request from 'supertest'
import app from '../../src/app'
import { cleanDb, seedEmployee } from '../helpers/seed'
import { signToken } from '../../src/utils/jwt'
import '../helpers/setup'

beforeEach(async () => { await cleanDb() })

function tokenFor(emp: { id: string; email: string; role: string; empCode: string }) {
  return signToken({ id: emp.id, email: emp.email, role: emp.role, empCode: emp.empCode })
}

describe('Attendance', () => {
  it('POST /checkin returns 201 with checkIn set and checkOut null', async () => {
    const emp = await seedEmployee({ empCode: 'ATT001' })
    const res = await request(app).post('/api/attendance/checkin')
      .set('Authorization', `Bearer ${tokenFor(emp)}`)
    expect(res.status).toBe(201)
    expect(res.body.data.checkIn).toBeDefined()
    expect(res.body.data.checkOut).toBeNull()
  })

  it('POST /checkin returns 409 on double check-in', async () => {
    const emp = await seedEmployee({ empCode: 'ATT002' })
    await request(app).post('/api/attendance/checkin')
      .set('Authorization', `Bearer ${tokenFor(emp)}`)
    const res = await request(app).post('/api/attendance/checkin')
      .set('Authorization', `Bearer ${tokenFor(emp)}`)
    expect(res.status).toBe(409)
  })

  it('POST /checkout returns 200 with checkOut and hoursWorked set', async () => {
    const emp = await seedEmployee({ empCode: 'ATT003' })
    await request(app).post('/api/attendance/checkin')
      .set('Authorization', `Bearer ${tokenFor(emp)}`)
    const res = await request(app).post('/api/attendance/checkout')
      .set('Authorization', `Bearer ${tokenFor(emp)}`)
    expect(res.status).toBe(200)
    expect(res.body.data.checkOut).toBeDefined()
    expect(res.body.data.hoursWorked).toBeDefined()
  })
})
