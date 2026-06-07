import 'dotenv/config'
import request from 'supertest'
import app from '../../src/app'
import { cleanDb, seedEmployee } from '../helpers/seed'
import '../helpers/setup'

beforeEach(async () => { await cleanDb() })

describe('POST /api/auth/login', () => {
  it('returns 200 + token on valid credentials', async () => {
    await seedEmployee({ email: 'login@test.com', password: undefined })
    // seedEmployee already hashes 'password123'
    const emp = await seedEmployee({ email: 'auth@test.com' })

    const res = await request(app).post('/api/auth/login').send({
      email: emp.email,
      password: 'password123',
    })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.token).toBeDefined()
    expect(res.body.data.employee.password).toBeUndefined()
  })

  it('returns 401 on wrong password', async () => {
    const emp = await seedEmployee()
    const res = await request(app).post('/api/auth/login').send({
      email: emp.email,
      password: 'wrongpassword',
    })
    expect(res.status).toBe(401)
  })

  it('returns 400 on missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'x@x.com' })
    expect(res.status).toBe(400)
  })

  it('returns 403 for inactive employee', async () => {
    const emp = await seedEmployee({ status: 'inactive' })
    const res = await request(app).post('/api/auth/login').send({
      email: emp.email,
      password: 'password123',
    })
    expect(res.status).toBe(403)
  })
})
