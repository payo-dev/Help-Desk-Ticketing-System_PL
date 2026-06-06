const bcrypt = require('bcrypt');
const db = require('./config/db'); // Make sure this path points to your db config

async function createAdmin() {
  try {
    const password = 'AdminPassword123!'; // This will be your login password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Assuming 'Admin' role is ID 1
    await db.query(
      'INSERT INTO users (employee_id, first_name, last_name, email, password, role_id) VALUES (?, ?, ?, ?, ?, ?)',
      ['ADMIN001', 'System', 'Admin', 'admin@gmail.com', hashedPassword, 1]
    );
    
    console.log('✅ Admin account created successfully!');
  } catch (err) {
    console.error('❌ Error creating admin:', err);
  } finally {
    process.exit();
  }
}

createAdmin();