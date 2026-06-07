const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// 1. GET all Published KB articles
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const [articles] = await db.query(`
      SELECT k.*, u.first_name, u.last_name 
      FROM knowledge_base k
      LEFT JOIN users u ON k.created_by = u.id
      WHERE k.status = 'Published' OR k.status IS NULL
      ORDER BY k.created_at DESC
    `);
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: 'Error loading articles.' });
  }
});

// 2. GET all Suggested KB articles (Admin Only)
router.get('/suggestions', isAuthenticated, async (req, res) => {
  if (req.session.user.role_id !== 1) return res.status(403).json({ message: 'Unauthorized.' });
  
  try {
    const [articles] = await db.query(`
      SELECT k.*, u.first_name, u.last_name 
      FROM knowledge_base k
      LEFT JOIN users u ON k.created_by = u.id
      WHERE k.status = 'Suggested'
      ORDER BY k.created_at DESC
    `);
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: 'Error loading suggestions.' });
  }
});

// 3. POST new article directly (Admin Only)
router.post('/', isAuthenticated, async (req, res) => {
  if (req.session.user.role_id !== 1) return res.status(403).json({ message: 'Unauthorized.' });
  
  try {
    const { title, content, category } = req.body;
    const created_by = req.session.user.id;
    await db.query(
      'INSERT INTO knowledge_base (title, content, category, created_by, status) VALUES (?, ?, ?, ?, ?)',
      [title, content, category, created_by, 'Published']
    );
    res.status(201).json({ message: 'Article created.' });
  } catch (err) {
    res.status(500).json({ message: 'Error saving article.' });
  }
});

// 4. POST new suggestion (Any Authenticated User)
router.post('/suggest', isAuthenticated, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const created_by = req.session.user.id;
    await db.query(
      'INSERT INTO knowledge_base (title, content, category, created_by, status) VALUES (?, ?, ?, ?, ?)',
      [title, content, category, created_by, 'Suggested']
    );
    res.status(201).json({ message: 'Suggestion submitted.' });
  } catch (err) {
    res.status(500).json({ message: 'Error saving suggestion.' });
  }
});

// 5. PUT approve suggestion (Admin Only)
router.put('/:id/approve', isAuthenticated, async (req, res) => {
  if (req.session.user.role_id !== 1) return res.status(403).json({ message: 'Unauthorized.' });
  
  try {
    const { id } = req.params;
    await db.query(
      'UPDATE knowledge_base SET status = ? WHERE id = ?',
      ['Published', id]
    );
    res.json({ message: 'Suggestion approved.' });
  } catch (err) {
    res.status(500).json({ message: 'Error approving suggestion.' });
  }
});

// 6. DELETE article/suggestion (Admin Only)
router.delete('/:id', isAuthenticated, async (req, res) => {
  if (req.session.user.role_id !== 1) return res.status(403).json({ message: 'Unauthorized.' });
  
  try {
    const { id } = req.params;
    await db.query('DELETE FROM knowledge_base WHERE id = ?', [id]);
    res.json({ message: 'Deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting.' });
  }
});

module.exports = router;