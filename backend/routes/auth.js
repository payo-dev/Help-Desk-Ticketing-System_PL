const express = require('express');
const router = express.Router();
const { login, logout, getMe } = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');

router.post('/login', login);
router.post('/logout', isAuthenticated, logout);
router.get('/me', isAuthenticated, getMe);

module.exports = router;