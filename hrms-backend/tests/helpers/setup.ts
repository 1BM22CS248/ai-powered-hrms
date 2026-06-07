import { pool } from '../../src/db/client'

afterAll(async () => {
  await pool.end()
})
