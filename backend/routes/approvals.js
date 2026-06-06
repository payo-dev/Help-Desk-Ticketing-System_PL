const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// GET: Fetch all approvals (linking to the ticket title/requester)
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const sql = `
            SELECT a.*, t.title as ticket_title, u.first_name, u.last_name 
            FROM approvals a 
            LEFT JOIN tickets t ON a.ticket_id = t.id
            LEFT JOIN users u ON a.approver_id = u.id
        `;
        
        // This will print the raw rows to your VS Code/Terminal
        const [rows] = await db.query(sql);
        console.log("DEBUG: Database returned these rows:", rows); 
        
        res.json(rows);
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Database query failed" });
    }
});
// PUT: Approve or Reject
// PUT: Approve or Reject
router.put('/:id', isAuthenticated, async (req, res) => {
    if (req.session.user.role_id !== 1) return res.status(403).send('Unauthorized');
    
    const { status, remarks } = req.body;
    const approvalId = req.params.id;

    // 1. Update the Approval record
    await db.query('UPDATE approvals SET status = ?, remarks = ?, approved_at = NOW() WHERE id = ?', 
        [status, remarks, approvalId]);

    // 2. Logic: If Approved, update Ticket to 'Reviewed' (which moves it to the IT Queue)
    if (status === 'Approved') {
        const [approval] = await db.query('SELECT ticket_id FROM approvals WHERE id = ?', [approvalId]);
        // Transition ticket from 'Pending Approval' to 'Reviewed'
        await db.query('UPDATE tickets SET status = "Reviewed" WHERE id = ?', [approval[0].ticket_id]);
    }
    
    // 3. Optional: If Rejected, you could set ticket to 'Closed' or 'Cancelled'
    if (status === 'Rejected') {
         const [approval] = await db.query('SELECT ticket_id FROM approvals WHERE id = ?', [approvalId]);
         await db.query('UPDATE tickets SET status = "Closed" WHERE id = ?', [approval[0].ticket_id]);
    }
    
    res.json({ message: 'Success' });
});

module.exports = router;