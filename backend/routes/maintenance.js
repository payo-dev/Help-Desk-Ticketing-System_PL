const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// 1. GET all maintenance records (Joined with Assets and Users)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const [records] = await db.query(`
      SELECT m.*, a.name as asset_name, a.asset_id as asset_tag, 
             u.first_name, u.last_name
      FROM maintenance_records m
      LEFT JOIN assets a ON m.asset_id = a.id
      LEFT JOIN users u ON m.performed_by = u.id
      ORDER BY m.scheduled_date ASC
    `);
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error loading maintenance records.' });
  }
});

// 2. POST a new maintenance schedule
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { asset_id, maintenance_type, description, scheduled_date, performed_by } = req.body;
    
    if (req.session.user.role_id !== 1) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    await db.query(
      `INSERT INTO maintenance_records (asset_id, maintenance_type, description, scheduled_date, status, performed_by) 
       VALUES (?, ?, ?, ?, 'Scheduled', ?)`,
      [asset_id, maintenance_type, description, scheduled_date, performed_by || null]
    );

    res.status(201).json({ message: 'Maintenance scheduled successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error scheduling maintenance.' });
  }
});
// 3. PUT (Update) a maintenance record (Mark as Done, edit details)
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const recordId = req.params.id;
    const { status, completed_date, cost, description, performed_by } = req.body;
    
    // Ensure only Admins can update maintenance
    if (req.session.user.role_id !== 1) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    const [result] = await db.query(
      `UPDATE maintenance_records 
       SET status = ?, completed_date = ?, cost = ?, description = ?, performed_by = ?
       WHERE id = ?`,
      [status, completed_date || null, cost || 0, description, performed_by || null, recordId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Record not found.' });
    }

    res.json({ message: 'Maintenance record updated successfully.' });
  } catch (err) {
    console.error('Error updating maintenance:', err);
    res.status(500).json({ message: 'Server error updating record.' });
  }
});

module.exports = router;