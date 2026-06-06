const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// 1. GET all KB articles
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const [articles] = await db.query(`
      SELECT k.*, u.first_name, u.last_name 
      FROM knowledge_base k
      LEFT JOIN users u ON k.created_by = u.id
      ORDER BY k.created_at DESC
    `);
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: 'Error loading articles.' });
  }
});

// 2. POST new article (Admin Only)
router.post('/', isAuthenticated, async (req, res) => {
  if (req.session.user.role_id !== 1) return res.status(403).json({ message: 'Unauthorized.' });
  
  try {
    const { title, content, category } = req.body;
    const created_by = req.session.user.id;
    await db.query(
      'INSERT INTO knowledge_base (title, content, category, created_by) VALUES (?, ?, ?, ?)',
      [title, content, category, created_by]
    );
    res.status(201).json({ message: 'Article created.' });
  } catch (err) {
    res.status(500).json({ message: 'Error saving article.' });
  }
});

module.exports = router;