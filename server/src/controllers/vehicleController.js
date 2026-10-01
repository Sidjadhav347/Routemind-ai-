import { Database } from '../database/db.js';

export class VehicleController {
  static async getAll(req, res) {
    const vehicles = Database.find('vehicles', v => v.user_id === req.user.id || v.user_id === '00000000-0000-4000-a000-000000000001');
    res.json({
      success: true,
      data: vehicles
    });
  }

  static async getById(req, res) {
    const vehicle = Database.findById('vehicles', req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: { code: 'VEHICLE_NOT_FOUND', message: 'Vehicle not found' }
      });
    }
    res.json({ success: true, data: vehicle });
  }

  static async create(req, res) {
    const newVehicle = Database.insert('vehicles', {
      user_id: req.user.id,
      ...req.body
    });
    res.status(201).json({ success: true, data: newVehicle });
  }

  static async update(req, res) {
    const vehicle = Database.findById('vehicles', req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: { code: 'VEHICLE_NOT_FOUND', message: 'Vehicle not found' }
      });
    }

    const updated = Database.update('vehicles', req.params.id, req.body);
    res.json({ success: true, data: updated });
  }

  static async delete(req, res) {
    const deleted = Database.delete('vehicles', req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'VEHICLE_NOT_FOUND', message: 'Vehicle not found' }
      });
    }
    res.json({ success: true, data: { message: 'Vehicle deleted successfully' } });
  }
}
