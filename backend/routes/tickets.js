const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');
const { sendNotification } = require('./notification-route');
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

    // After ticket is created
    await sendNotification(db, requester_id, 'Ticket Submitted', `Your ticket ${ticket_number} has been received.`, 'new_ticket');

    // Notify Admins (role_id 1) and System Administrators (role_id 8) about the new ticket
    const [admins] = await db.query('SELECT id FROM users WHERE role_id IN (1, 8)');
    for (const admin of admins) {
      if (admin.id !== requester_id) {
        await sendNotification(db, admin.id, 'New Ticket Alert', `A new ticket ${ticket_number} has been submitted.`, 'new_ticket');
      }
    }

    // Notify Specialists matching the ticket's category
    const deptCategoryMap = {
      'IT Support': 'IT Department',
      'HR Concern': 'Human Resources',
      'Finance Request': 'Finance',
      'Facilities Request': 'Facilities',
      'Procurement Request': 'Procurement',
      'General Inquiry': 'General Operations'
    };

    if (category === 'General Inquiry') {
      const [specialists] = await db.query(
        "SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name LIKE '%Specialist%'"
      );
      for (const spec of specialists) {
        if (spec.id !== requester_id) {
          await sendNotification(db, spec.id, 'New General Ticket', `A new General Inquiry ticket ${ticket_number} is in the pool.`, 'new_ticket');
        }
      }
    } else {
      const targetDeptName = deptCategoryMap[category];
      if (targetDeptName) {
        const [specialists] = await db.query(
          "SELECT u.id FROM users u JOIN departments d ON u.department_id = d.id JOIN roles r ON u.role_id = r.id WHERE r.name LIKE '%Specialist%' AND (d.name = ? OR d.name LIKE ?)",
          [targetDeptName, `${targetDeptName.split(' ')[0]}%`]
        );
        for (const spec of specialists) {
          if (spec.id !== requester_id) {
            await sendNotification(db, spec.id, 'New Ticket in Pool', `A new ${category} ticket ${ticket_number} needs assignment.`, 'new_ticket');
          }
        }
      }
    }

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

    const [[ticketInfo]] = await db.query('SELECT requester_id FROM tickets WHERE id = ?', [id]);
    if (ticketInfo && ticketInfo.requester_id) {
      await sendNotification(db, ticketInfo.requester_id, 'Ticket Status Updated', `Your ticket status changed to ${status}.`, 'status_changed');
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

    let query = 'UPDATE tickets SET status = ?, priority = ?, assigned_to = ?';
    let params = [status, priority, assigned_to || null];

    // If a specialist is assigned, automatically update the ticket's category to match their department
    if (assigned_to) {
      const [[userDept]] = await db.query(
        'SELECT d.id as dept_id, d.name as dept_name FROM users u JOIN departments d ON u.department_id = d.id WHERE u.id = ?',
        [assigned_to]
      );

      if (userDept) {
        const deptCategoryMap = {
          'IT Department':      'IT Support',
          'Human Resources':    'HR Concern',
          'Finance':            'Finance Request',
          'Facilities':         'Facilities Request',
          'Procurement':        'Procurement Request',
          'General Operations': 'General Inquiry',
          'Operations':         'General Inquiry'
        };
        const newCategory = deptCategoryMap[userDept.dept_name];
        
        if (newCategory) {
          query += ', category = ?, department_id = ?';
          params.push(newCategory, userDept.dept_id);
        }
      }
    }

    query += ' WHERE id = ?';
    params.push(id);

    await db.query(query, params);

    if (assigned_to) {
      const [[ticketInfo]] = await db.query('SELECT ticket_number FROM tickets WHERE id = ?', [id]);
      if (ticketInfo) {
        await sendNotification(db, assigned_to, 'Ticket Assigned', `Ticket ${ticketInfo.ticket_number} has been assigned to you.`, 'ticket_assigned');
      }
    }

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

    // Notify Specialists of the new department that a ticket was transferred to them
    const [[ticketInfo]] = await db.query('SELECT ticket_number FROM tickets WHERE id = ?', [id]);
    const deptCategoryMap = {
      'IT Support': 'IT Department',
      'HR Concern': 'Human Resources',
      'Finance Request': 'Finance',
      'Facilities Request': 'Facilities',
      'Procurement Request': 'Procurement',
      'General Inquiry': 'General Operations'
    };

    if (category === 'General Inquiry' && ticketInfo) {
      const [specialists] = await db.query(
        "SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name LIKE '%Specialist%'"
      );
      for (const spec of specialists) {
        await sendNotification(db, spec.id, 'Ticket Transferred', `Ticket ${ticketInfo.ticket_number} was transferred to the General pool.`, 'new_ticket');
      }
    } else {
      const targetDeptName = deptCategoryMap[category];
      if (targetDeptName && ticketInfo) {
        const [specialists] = await db.query(
          "SELECT u.id FROM users u JOIN departments d ON u.department_id = d.id JOIN roles r ON u.role_id = r.id WHERE r.name LIKE '%Specialist%' AND (d.name = ? OR d.name LIKE ?)",
          [targetDeptName, `${targetDeptName.split(' ')[0]}%`]
        );
        for (const spec of specialists) {
          await sendNotification(db, spec.id, 'Ticket Transferred', `Ticket ${ticketInfo.ticket_number} was transferred to your pool.`, 'new_ticket');
        }
      }
    }

    res.json({ message: 'Ticket transferred.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});





module.exports = router;