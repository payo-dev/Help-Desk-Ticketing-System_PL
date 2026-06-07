const express = require('express');
const router = express.Router();
const db = require('../config/db'); 
const bcrypt = require('bcryptjs'); // Or 'bcrypt' depending on your package.json

// 1. GET ALL USERS
router.get('/', async (req, res) => {
    try {
        // Join with roles and departments to get the text names instead of just IDs
        const query = `
            SELECT u.id, u.first_name, u.last_name, u.email, u.is_active, r.name as role, d.name as department 
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN departments d ON u.department_id = d.id
            ORDER BY u.created_at DESC
        `;
        const [users] = await db.query(query);
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// 2. CREATE NEW USER
router.post('/', async (req, res) => {
    const { first_name, last_name, email, password, role_id, department_id } = req.body;

    try {
        // Hash the password for security
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate a random Employee ID (e.g., EMP-4928)
        const empId = 'EMP-' + Math.floor(1000 + Math.random() * 9000);

        const [result] = await db.query(
            `INSERT INTO users (employee_id, first_name, last_name, email, password, role_id, department_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [empId, first_name, last_name, email, hashedPassword, role_id, department_id]
        );

        res.status(201).json({ message: "User created successfully", id: result.insertId });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Email already exists" });
        }
        res.status(500).json({ error: "Failed to create user" });
    }
});


// 3. GET ONLY IT SPECIALISTS (For the Assignment Dropdown)
router.get('/specialists', async (req, res) => {
    try {
        // Fetch users who are IT Specialists (role_id = 2) or Admins (role_id = 1)
        const [specialists] = await db.query(
            `SELECT u.id, u.first_name, u.last_name, r.name as role 
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.role_id IN (1, 2) AND u.is_active = TRUE`
        );
        res.json(specialists);
    } catch (err) {
        console.error("Error fetching specialists:", err);
        res.status(500).json({ error: "Failed to fetch specialists" });
    }
});




module.exports = router;