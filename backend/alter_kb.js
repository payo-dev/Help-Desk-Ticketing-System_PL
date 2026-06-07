const db = require('./config/db');

async function run() {
  try {
    await db.query(`ALTER TABLE knowledge_base ADD COLUMN status VARCHAR(20) DEFAULT 'Published';`);
    console.log("Success");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Column already exists");
    } else {
      console.error(err);
    }
  }
  process.exit(0);
}
run();