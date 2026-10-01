import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database/db.js';
import { config } from '../config/index.js';

export class AuthController {
  static async register(req, res, next) {
    try {
      const { email, password, name, role = 'OPERATOR' } = req.body;

      // Check if user already exists
      const existing = Database.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'An account with this email address already exists.'
          }
        });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const userId = uuidv4();

      const newUser = Database.insert('users', {
        id: userId,
        email: email.toLowerCase(),
        name,
        password_hash: passwordHash,
        role
      });

      // Initialize default user preferences
      Database.insert('user_preferences', {
        id: uuidv4(),
        user_id: userId,
        preferred_mode: 'BALANCED',
        max_travel_budget: 3000.00,
        preferred_fuel_efficiency: 10.0,
        arrival_buffer_mins: 30,
        notify_on_traffic: true,
        notify_on_reroute: true
      });

      // Generate JWT
      const token = jwt.sign({ userId: newUser.id, email: newUser.email, role: newUser.role }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn
      });

      const { password_hash, ...safeUser } = newUser;

      res.status(201).json({
        success: true,
        data: {
          user: safeUser,
          token
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = Database.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password.'
          }
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password.'
          }
        });
      }

      const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn
      });

      const { password_hash, ...safeUser } = user;

      res.json({
        success: true,
        data: {
          user: safeUser,
          token
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async me(req, res) {
    const preferences = Database.findOne('user_preferences', p => p.user_id === req.user.id) || null;
    res.json({
      success: true,
      data: {
        user: req.user,
        preferences
      }
    });
  }
}
