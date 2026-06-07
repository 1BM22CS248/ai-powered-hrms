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

describe('GET /api/employees', () => {
  it('returns 200 + array for hr role', async () => {
    const hr  = await seedEmployee({ role: 'hr', empCode: 'HR001' })
    const res = await request(app).get('/api/employees')
      .set('Authorization', `Bearer ${tokenFor(hr)}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('returns 403 for employee role', async () => {
    const emp = await seedEmployee({ empCode: 'EMP001' })
    const res = await request(app).get('/api/employees')
      .set('Authorization', `Bearer ${tokenFor(emp)}`)
    expect(res.status).toBe(403)
  })

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/employees')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/employees', () => {
  it('creates employee and returns 201 without password field', async () => {
    const hr  = await seedEmployee({ role: 'hr', empCode: 'HR002' })
    const res = await request(app).post('/api/employees')
      .set('Authorization', `Bearer ${tokenFor(hr)}`)
      .send({
        empCode: 'NEW001', name: 'New Person', email: 'new@hrms.com',
        password: 'Pass1234!', department: 'Engineering', role: 'employee',
      })
    expect(res.status).toBe(201)
    expect(res.body.data.password).toBeUndefined()
    expect(res.body.data.email).toBe('new@hrms.com')
  })

  it('returns 409 on duplicate email', async () => {
    const hr  = await seedEmployee({ role: 'hr', empCode: 'HR003' })
    const existing = await seedEmployee({ empCode: 'EMP999' })
    const res = await request(app).post('/api/employees')
      .set('Authorization', `Bearer ${tokenFor(hr)}`)
      .send({
        empCode: 'DUP001', name: 'Dup', email: existing.email,
        password: 'Pass1234!',
      })
    expect(res.status).toBe(409)
  })
})
