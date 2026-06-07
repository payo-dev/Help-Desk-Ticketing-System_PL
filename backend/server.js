const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Test Route
app.get('/', (req, res) => {
  res.json({ message: 'ERP Help Desk API is running!' });
});

// Routes (we'll add these next)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/maintenance', require('./routes/maintenance'))
app.use('/api/kb', require('./routes/kb'));
app.use('/api/approvals', require('./routes/approvals'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/users', require('./routes/users'));
// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});