const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// GET tickets (Smart Filtering)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const roleId = req.session.user.role_id; // Assume 1 = Admin, 2 = Employee

    let query = 'SELECT * FROM tickets';
    let params = [];

    // If not Admin (1), restrict to only their tickets
    if (roleId !== 1) {
      query += ' WHERE requester_id = ?';
      params = [userId];
    } else {
      query += ' ORDER BY created_at DESC';
    }

    const [tickets] = await db.query(query, params);
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching tickets' });
  }
});

// POST a new ticket
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { title, category, priority } = req.body;
    const requester_id = req.session.user.id;
    const ticket_number = 'TK-' + Date.now().toString().slice(-6);

    await db.query(
      `INSERT INTO tickets (ticket_number, title, category, priority, status, requester_id) 
       VALUES (?, ?, ?, ?, 'Submitted', ?)`,
      [ticket_number, title, category, 'Medium', requester_id]
    );

    res.status(201).json({ message: 'Ticket created!' });
  } catch (err) {
    res.status(500).json({ message: 'Error creating ticket' });
  }
});

module.exports = router;