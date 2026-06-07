const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { isAuthenticated } = require('../middleware/auth');

// ===================== GET ALL USERS =====================
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT u.id, u.employee_id, u.first_name, u.last_name, u.email,
             u.is_active, u.created_at,
             r.name as role,
             d.name as department
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY u.created_at DESC
    `);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ===================== GET ALL ROLES =====================
router.get('/roles', isAuthenticated, async (req, res) => {
  try {
    const [roles] = await db.query('SELECT id, name FROM roles ORDER BY id ASC');
    // Remove duplicate role names
    const seen = new Set();
    const unique = roles.filter(r => {
      if (seen.has(r.name)) return false;
      seen.add(r.name);
      return true;
    });
    res.json(unique);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ===================== GET ALL DEPARTMENTS =====================
router.get('/departments', isAuthenticated, async (req, res) => {
  try {
    const [depts] = await db.query('SELECT id, name FROM departments ORDER BY id ASC');
    res.json(depts);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ===================== GET SPECIALISTS (for assign dropdown) =====================
router.get('/specialists', isAuthenticated, async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT u.id, u.first_name, u.last_name, r.name as role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name LIKE '%Specialist%' AND u.is_active = 1
      ORDER BY u.first_name ASC
    `);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ===================== CREATE USER =====================
router.post('/', isAuthenticated, async (req, res) => {
  try {
    // Only admin can create users
    if (req.session.user.role_id !== 1) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    const { employee_id, first_name, last_name, email, password, role_id, department_id } = req.body;

    if (!first_name || !last_name || !email || !password || !role_id) {
      return res.status(400).json({ message: 'All required fields must be filled.' });
    }

    // Check if email already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already in use.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(`
      INSERT INTO users (employee_id, first_name, last_name, email, password, role_id, department_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `, [employee_id || null, first_name, last_name, email, hashedPassword, role_id, department_id || null]);

    // Audit log
    await db.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.session.user.id, 'Created User', `Created user: ${email}`]
    );

    res.status(201).json({ message: 'User created successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ===================== TOGGLE USER STATUS =====================
router.put('/:id/status', isAuthenticated, async (req, res) => {
  try {
    if (req.session.user.role_id !== 1) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    const { is_active } = req.body;
    const { id } = req.params;

    // Prevent admin from deactivating themselves
    if (parseInt(id) === req.session.user.id) {
      return res.status(400).json({ message: 'You cannot deactivate your own account.' });
    }

    await db.query('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);

    res.json({ message: `User ${is_active ? 'activated' : 'deactivated'} successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;