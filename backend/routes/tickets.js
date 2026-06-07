const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// ⚠️ /my MUST be before GET / otherwise Express won't reach it
// 1. GET /my — Employee sees only their own tickets
router.get('/my', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const [tickets] = await db.query(
      'SELECT * FROM tickets WHERE requester_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// 2. GET / — Admin/Help Desk sees all tickets
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const [tickets] = await db.query('SELECT * FROM tickets ORDER BY created_at DESC');
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// 3. POST / — Create a new ticket
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;
    const requester_id = req.session.user.id;

    if (!title || !category) {
      return res.status(400).json({ message: 'Title and category are required.' });
    }

    const date = new Date();
    const datePart = date.toISOString().slice(0,10).replace(/-/g,'');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const ticket_number = `TK-${datePart}-${randomPart}`;

    const slaHours = { Critical: 4, High: 8, Medium: 24, Low: 72 };
    const hours = slaHours[priority] || 24;
    const sla_deadline = new Date(Date.now() + hours * 60 * 60 * 1000);

    const [result] = await db.query(
      `INSERT INTO tickets 
        (ticket_number, title, description, category, priority, status, requester_id, sla_deadline)
       VALUES (?, ?, ?, ?, ?, 'Submitted', ?, ?)`,
      [ticket_number, title, description || '', category, priority || 'Medium', requester_id, sla_deadline]
    );

    res.status(201).json({
      message: 'Ticket created successfully.',
      ticket_id: result.insertId,
      ticket_number
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating ticket.' });
  }
});

// 4. PUT /:id/status — Update ticket status
router.put('/:id/status', isAuthenticated, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (req.session.user.role_id !== 1) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    const [result] = await db.query(
      'UPDATE tickets SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    res.json({ message: 'Status updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/tickets/:id/rate — Submit satisfaction rating
router.post('/:id/rate', isAuthenticated, async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const userId = req.session.user.id;
    const ticketId = req.params.id;

    await db.query(
      `INSERT INTO satisfaction_ratings (ticket_id, user_id, rating, feedback)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = ?, feedback = ?`,
      [ticketId, userId, rating, feedback, rating, feedback]
    );

    res.json({ message: 'Rating submitted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});


// PUT /api/tickets/:id/assign — Admin assigns ticket
router.put('/:id/assign', isAuthenticated, async (req, res) => {
  try {
    const { status, priority, assigned_to } = req.body;
    const { id } = req.params;

    await db.query(
      'UPDATE tickets SET status = ?, priority = ?, assigned_to = ? WHERE id = ?',
      [status, priority, assigned_to || null, id]
    );

    res.json({ message: 'Ticket updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});


// GET /api/tickets/queue/specialist — Get my tickets and unassigned IT tickets
router.get('/queue/specialist', async (req, res) => {
    try {
        // Assuming your auth middleware sets req.session.user
        const userId = req.session.user.id; 
        const userDept = req.session.user.department_id; // e.g., 1 for IT

        // 1. Get tickets assigned specifically to this specialist
        const [myTickets] = await db.query(
            `SELECT * FROM tickets WHERE assigned_to = ? AND status NOT IN ('Resolved', 'Closed') ORDER BY created_at DESC`,
            [userId]
        );

        // 2. Get unassigned tickets belonging to their department
        const [unassigned] = await db.query(
            `SELECT * FROM tickets WHERE assigned_to IS NULL AND department_id = ? AND status NOT IN ('Resolved', 'Closed') ORDER BY created_at DESC`,
            [userDept]
        );

        res.json({ myTickets, unassigned });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/tickets/:id/transfer — Transfer to another department
router.put('/:id/transfer', async (req, res) => {
    try {
        const { target_department_id } = req.body;
        const ticketId = req.params.id;

        // Reset the ticket, remove the assignee, and change the department
        await db.query(
            `UPDATE tickets SET department_id = ?, assigned_to = NULL, status = 'Submitted' WHERE id = ?`,
            [target_department_id, ticketId]
        );

        res.json({ message: 'Ticket transferred successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});






module.exports = router;