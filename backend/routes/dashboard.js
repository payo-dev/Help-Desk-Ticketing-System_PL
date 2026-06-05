const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

router.get('/stats', isAuthenticated, async (req, res) => {
  try {
    // 1. KPI Counts
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM tickets');
    const [[{ open }]] = await db.query(`SELECT COUNT(*) as open FROM tickets WHERE status NOT IN ('Resolved','Closed')`);
    const [[{ resolved_today }]] = await db.query(`SELECT COUNT(*) as resolved_today FROM tickets WHERE status = 'Resolved' AND DATE(updated_at) = CURDATE()`);
    const [[{ critical }]] = await db.query(`SELECT COUNT(*) as critical FROM tickets WHERE priority = 'Critical' AND status NOT IN ('Resolved','Closed')`);

    // 2. Monthly Volume Data
    const [monthlyResults] = await db.query(`
      SELECT MONTH(created_at) as month, COUNT(*) as count 
      FROM tickets 
      WHERE YEAR(created_at) = YEAR(CURDATE()) 
      GROUP BY MONTH(created_at)
    `);
    
    // Convert to an array of 12 numbers (Jan to Dec)
    const monthly_counts = new Array(12).fill(0);
    monthlyResults.forEach(row => {
      monthly_counts[row.month - 1] = row.count;
    });

    // 3. Priority Breakdown Data
    const [priorityResults] = await db.query(`
      SELECT priority, COUNT(*) as count 
      FROM tickets 
      GROUP BY priority
    `);

    // Ensure specific order: Critical, High, Medium, Low
    const priorityMap = { 'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0 };
    priorityResults.forEach(row => {
      if (priorityMap.hasOwnProperty(row.priority)) {
        priorityMap[row.priority] = row.count;
      }
    });
    const priority_counts = [priorityMap['Critical'], priorityMap['High'], priorityMap['Medium'], priorityMap['Low']];

    // 4. Recent Tickets
    const [recent_tickets] = await db.query(`SELECT * FROM tickets ORDER BY created_at DESC LIMIT 10`);

    // Send everything to frontend
    res.json({ 
      total, 
      open, 
      resolved_today, 
      critical, 
      recent_tickets, 
      monthly_counts, 
      priority_counts 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;