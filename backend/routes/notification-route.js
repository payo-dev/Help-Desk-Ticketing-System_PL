const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// ===================== GET MY NOTIFICATIONS =====================
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const [notifs] = await db.query(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `, [userId]);
    res.json(notifs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ===================== MARK ONE AS READ =====================
router.put('/:id/read', isAuthenticated, async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.session.user.id]
    );
    res.json({ message: 'Marked as read.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ===================== MARK ALL READ =====================
router.put('/read-all', isAuthenticated, async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [req.session.user.id]
    );
    res.json({ message: 'All marked as read.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ===================== DELETE ONE =====================
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.session.user.id]
    );
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ===================== CLEAR ALL =====================
router.delete('/clear-all', isAuthenticated, async (req, res) => {
  try {
    await db.query('DELETE FROM notifications WHERE user_id = ?', [req.session.user.id]);
    res.json({ message: 'All cleared.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ===================== SEND NOTIFICATION (internal helper) =====================
// Call this from other routes to create notifications
// Usage: await sendNotification(db, userId, title, message, type)
const sendNotification = async (db, userId, title, message, type = 'general') => {
  try {
    await db.query(
      'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, 0)',
      [userId, title, message, type]
    );
  } catch (err) {
    console.error('Failed to send notification:', err);
  }
};

module.exports = router;
module.exports.sendNotification = sendNotification;