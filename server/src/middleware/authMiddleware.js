import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { Database } from '../database/db.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token required'
      }
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = Database.findById('users', decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User associated with token no longer exists'
        }
      });
    }

    // Attach user without sensitive password hash
    const { password_hash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: err.name === 'TokenExpiredError' ? 'Authentication token expired' : 'Invalid token signature'
      }
    });
  }
}
