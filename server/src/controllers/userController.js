import { Database } from '../database/db.js';

export class UserController {
  static async getProfile(req, res) {
    const preferences = Database.findOne('user_preferences', p => p.user_id === req.user.id);
    res.json({
      success: true,
      data: {
        user: req.user,
        preferences
      }
    });
  }

  static async updateProfile(req, res) {
    const { name } = req.body;
    const updated = Database.update('users', req.user.id, { name });
    const { password_hash, ...safeUser } = updated;
    res.json({
      success: true,
      data: safeUser
    });
  }

  static async getPreferences(req, res) {
    const preferences = Database.findOne('user_preferences', p => p.user_id === req.user.id);
    res.json({
      success: true,
      data: preferences
    });
  }

  static async updatePreferences(req, res) {
    const currentPref = Database.findOne('user_preferences', p => p.user_id === req.user.id);
    let updated;
    if (currentPref) {
      updated = Database.update('user_preferences', currentPref.id, req.body);
    } else {
      updated = Database.insert('user_preferences', {
        user_id: req.user.id,
        ...req.body
      });
    }

    res.json({
      success: true,
      data: updated
    });
  }
}
