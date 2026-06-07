const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Adjust path if needed

router.get('/summary', async (req, res) => {
    try {
        // Run multiple queries at the same time for performance
        const [
            [totalTickets],
            [openTickets],
            [ticketsByCategory],
            [ticketsByStatus]
        ] = await Promise.all([
            // 1. Total Tickets Ever
            db.query('SELECT COUNT(*) as count FROM tickets'),
            // 2. Currently Open/Active Tickets
            db.query('SELECT COUNT(*) as count FROM tickets WHERE status NOT IN ("Resolved", "Closed")'),
            // 3. Breakdown by Category
            db.query('SELECT category, COUNT(*) as count FROM tickets GROUP BY category'),
            // 4. Breakdown by Status
            db.query('SELECT status, COUNT(*) as count FROM tickets GROUP BY status')
        ]);

        // Send it all back as one neat JSON package
        res.json({
            metrics: {
                total: totalTickets[0].count,
                open: openTickets[0].count
            },
            charts: {
                byCategory: ticketsByCategory,
                byStatus: ticketsByStatus
            }
        });
    } catch (err) {
        console.error("Reports API Error:", err);
        res.status(500).json({ error: "Failed to generate reports" });
    }
});

module.exports = router;