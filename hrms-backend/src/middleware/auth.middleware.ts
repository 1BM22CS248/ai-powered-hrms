import { Request, Response, NextFunction } from 'express'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import { verifyToken, JwtPayload } from '../utils/jwt'
import { AppError } from '../utils/errors'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    // Prefer httpOnly cookie (H-6 fix); fall back to Authorization header for API clients
    const cookieToken = req.cookies?.['hrms-token'] as string | undefined
    const headerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : undefined

    const token = cookieToken ?? headerToken
    if (!token) {
      throw new AppError('No token provided', 401)
    }
    req.user = verifyToken(token)
    next()
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      next(new AppError('Token expired', 401))
    } else if (err instanceof JsonWebTokenError) {
      next(new AppError('Invalid token', 401))
    } else {
      next(err)
    }
  }
}
