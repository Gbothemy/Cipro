// Database setup script
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔌 Connecting to database...');
    const client = await pool.connect();
    
    console.log('📖 Reading SQL setup file...');
    const sql = fs.readFileSync('./DATABASE-SETUP.sql', 'utf8');
    
    console.log('🚀 Executing database setup...');
    await client.query(sql);
    
    console.log('✅ Database setup complete!');
    console.log('📊 All tables created successfully.');
    
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

setupDatabase();
