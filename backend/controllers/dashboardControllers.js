const db = require('../config/db');

const getDashboardStats = async (req, res) => {
  try {
    // 1. Get counts using individual queries (simple and reliable)
    const [total] = await db.query("SELECT COUNT(*) as count FROM tickets");
    const [open] = await db.query("SELECT COUNT(*) as count FROM tickets WHERE status = 'Submitted' OR status = 'In Progress'");
    const [resolved] = await db.query("SELECT COUNT(*) as count FROM tickets WHERE status = 'Resolved' AND DATE(updated_at) = CURDATE()");
    const [critical] = await db.query("SELECT COUNT(*) as count FROM tickets WHERE priority = 'Critical'");

    // 2. Get the 5 most recent tickets
    const [recent] = await db.query(`
      SELECT ticket_number, title, category, priority, status, created_at 
      FROM tickets 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    // 3. Send the response
    res.json({
      total: total[0].count,
      open: open[0].count,
      resolved_today: resolved[0].count,
      critical: critical[0].count,
      recent_tickets: recent
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching stats.' });
  }
};

module.exports = { getDashboardStats };