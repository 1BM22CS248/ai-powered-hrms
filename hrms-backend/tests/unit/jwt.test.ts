import '../helpers/setup'
import { signToken, verifyToken } from '../../src/utils/jwt'

const payload = { id: 'abc-123', email: 'test@test.com', role: 'employee', empCode: 'EMP001' }

describe('JWT', () => {
  it('signs and verifies a token correctly', () => {
    const token = signToken(payload)
    const decoded = verifyToken(token)
    expect(decoded.id).toBe(payload.id)
    expect(decoded.email).toBe(payload.email)
    expect(decoded.role).toBe(payload.role)
  })

  it('throws on a tampered token', () => {
    const token = signToken(payload)
    expect(() => verifyToken(token + 'tampered')).toThrow()
  })

  it('throws on a completely invalid token', () => {
    expect(() => verifyToken('not.a.token')).toThrow()
  })
})
