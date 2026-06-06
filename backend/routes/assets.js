const express = require('express');
const router = express.Router(); 
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// 1. GET all assets (Joined with user and department names for the table)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const [assets] = await db.query(`
      SELECT a.*, u.first_name, u.last_name, d.name as department_name 
      FROM assets a
      LEFT JOIN users u ON a.assigned_to = u.id
      LEFT JOIN departments d ON a.department_id = d.id
      ORDER BY a.created_at DESC
    `);
    res.json(assets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error loading assets.' });
  }
});

// 2. POST a new asset
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { name, category, brand, serial_number, status, health_score } = req.body;
    
    // Ensure only Admins/Asset Managers can add assets
    if (req.session.user.role_id !== 1) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    // Generate unique Asset ID (e.g., AST-123456)
    const asset_id = 'AST-' + Date.now().toString().slice(-6);

    await db.query(
      `INSERT INTO assets (asset_id, name, category, brand, serial_number, status, health_score) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [asset_id, name, category, brand, serial_number, status, health_score || 'Excellent']
    );

    res.status(201).json({ message: 'Asset added successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating asset.' });
  }
});

module.exports = router;