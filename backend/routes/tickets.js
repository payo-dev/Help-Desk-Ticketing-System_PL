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
    const { status, notes } = req.body;
    const { id } = req.params;
    const userId = req.session.user.id;

    // Prevent standard Employees (role_id 3) from arbitrarily updating ticket status
    if (req.session.user.role_id === 3) {
      return res.status(403).json({ message: 'Unauthorized to update ticket status.' });
    }

    const [result] = await db.query(
      'UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    // If the specialist added technical notes, save them to ticket_comments
    if (notes && notes.trim() !== '') {
      await db.query(
        'INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES (?, ?, ?)',
        [id, userId, notes.trim()]
      );
    }

    // Log the status change in ticket_history
    await db.query(
      'INSERT INTO ticket_history (ticket_id, changed_by, field_changed, new_value) VALUES (?, ?, ?, ?)',
      [id, userId, 'status', status]
    );

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


// ===================== ADD THESE TO backend/routes/tickets.js =====================

// GET /api/tickets/queue/specialist
// Returns: { myTickets: [...], unassigned: [...] }
// Smart: filters unassigned pool by the specialist's department category
router.get('/queue/specialist', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const dept = req.session.user.department; // e.g. "IT", "HR", "Finance"

    // Map department to ticket category
const deptCategoryMap = {
  'IT Department':      'IT Support',
  'Human Resources':    'HR Concern',
  'Finance':            'Finance Request',
  'Facilities':         'Facilities Request',
  'Procurement':        'Procurement Request',
  'General Operations': 'General Inquiry',
  'Operations':         'General Inquiry',
};
    const myCategory = deptCategoryMap[dept] || null;

    // My assigned tickets (not resolved/closed)
    const [myTickets] = await db.query(`
      SELECT * FROM tickets
      WHERE assigned_to = ?
      AND status NOT IN ('Resolved', 'Closed')
      ORDER BY created_at DESC
    `, [userId]);

    // Unassigned pool — filtered to specialist's category
    let unassignedQuery = `
      SELECT * FROM tickets
      WHERE assigned_to IS NULL
      AND status NOT IN ('Resolved', 'Closed')
    `;
    const params = [];

    if (myCategory) {
      unassignedQuery += ` AND category IN (?, 'General Inquiry')`;
      params.push(myCategory);
    }
    unassignedQuery += ` ORDER BY created_at ASC`;

    const [unassigned] = await db.query(unassignedQuery, params);

    // My resolved tickets
    const [resolvedTickets] = await db.query(`
      SELECT * FROM tickets
      WHERE assigned_to = ?
      AND status IN ('Resolved', 'Closed')
      ORDER BY updated_at DESC
    `, [userId]);

    res.json({ myTickets, unassigned, resolvedTickets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/tickets/:id/claim
// Specialist claims a ticket from the pool — assigns it to themselves
router.put('/:id/claim', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;

    await db.query(
      `UPDATE tickets SET assigned_to = ?, status = 'In Progress' WHERE id = ? AND assigned_to IS NULL`,
      [userId, id]
    );

    res.json({ message: 'Ticket claimed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/tickets/:id/transfer
// Specialist transfers a misrouted ticket to another category (unassigns it)
router.put('/:id/transfer', isAuthenticated, async (req, res) => {
  try {
    const { category } = req.body;
    const { id } = req.params;

    await db.query(
      `UPDATE tickets SET category = ?, assigned_to = NULL, status = 'Submitted' WHERE id = ?`,
      [category, id]
    );

    res.json({ message: 'Ticket transferred.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});





module.exports = router;