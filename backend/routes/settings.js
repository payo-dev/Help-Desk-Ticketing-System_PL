const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. GET ALL SETTINGS
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT setting_key, setting_value FROM system_settings');
        
        // Convert array of rows into a simple object: { "company_name": "My Corp", ... }
        const settings = {};
        rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        
        res.json(settings);
    } catch (err) {
        console.error("Error fetching settings:", err);
        res.status(500).json({ error: "Failed to fetch settings" });
    }
});

// 2. UPDATE SETTINGS
router.put('/', async (req, res) => {
    const settings = req.body; // Expecting an object of key-value pairs

    try {
        // We use a loop to update each key. 
        // ON DUPLICATE KEY UPDATE ensures it creates it if it doesn't exist yet!
        for (const [key, value] of Object.entries(settings)) {
            await db.query(
                `INSERT INTO system_settings (setting_key, setting_value) 
                 VALUES (?, ?) 
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
                [key, value]
            );
        }
        res.json({ message: "Settings updated successfully" });
    } catch (err) {
        console.error("Error updating settings:", err);
        res.status(500).json({ error: "Failed to update settings" });
    }
});

module.exports = router;