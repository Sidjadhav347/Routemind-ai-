import { Database } from '../database/db.js';

export class CargoController {
  static async getAll(req, res) {
    const cargo = Database.find('cargo', c => c.user_id === req.user.id || c.user_id === '00000000-0000-4000-a000-000000000001');
    res.json({
      success: true,
      data: cargo
    });
  }

  static async getById(req, res) {
    const item = Database.findById('cargo', req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'CARGO_NOT_FOUND', message: 'Cargo consignment not found' }
      });
    }
    res.json({ success: true, data: item });
  }

  static async create(req, res) {
    const newCargo = Database.insert('cargo', {
      user_id: req.user.id,
      ...req.body
    });
    res.status(201).json({ success: true, data: newCargo });
  }

  static async update(req, res) {
    const item = Database.findById('cargo', req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'CARGO_NOT_FOUND', message: 'Cargo consignment not found' }
      });
    }

    const updated = Database.update('cargo', req.params.id, req.body);
    res.json({ success: true, data: updated });
  }

  static async delete(req, res) {
    const deleted = Database.delete('cargo', req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'CARGO_NOT_FOUND', message: 'Cargo consignment not found' }
      });
    }
    res.json({ success: true, data: { message: 'Cargo item removed' } });
  }
}
