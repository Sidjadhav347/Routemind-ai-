import { Database } from '../database/db.js';

export class NotificationController {
  static async getNotifications(req, res) {
    const list = Database.find('notifications', n => n.user_id === req.user.id);
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({
      success: true,
      data: list
    });
  }

  static async markAsRead(req, res) {
    const updated = Database.update('notifications', req.params.id, { is_read: true });
    res.json({
      success: true,
      data: updated
    });
  }

  static async markAllAsRead(req, res) {
    const userNotifications = Database.find('notifications', n => n.user_id === req.user.id);
    for (const n of userNotifications) {
      Database.update('notifications', n.id, { is_read: true });
    }
    res.json({
      success: true,
      data: { message: 'All notifications marked as read' }
    });
  }
}
